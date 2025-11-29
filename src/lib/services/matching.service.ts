// src/services/matching.service.ts

import {prisma} from '@/lib/prisma'
import {Logger} from '@/lib/utils/logger'
import {GeoUtil} from '@/lib/utils/geo-util'
import * as tf from '@tensorflow/tfjs'
import type {BloodRequest, Donation, DonorProfile, RequestMatch, User} from '@prisma/client'

interface MatchingFeatures {
    bloodTypeScore: number
    distanceScore: number
    reputationScore: number
    availabilityScore: number
    urgencyScore: number
    successRateScore: number
    responseTimeScore: number
    fraudRiskScore: number
}

interface AutomatchResult {
    matchId: string
    donorId: string
    score: number
    features: MatchingFeatures
}

// Extended types to match actual database structure
type DonorProfileWithRelations = DonorProfile & {
    user: User | null
    donations: Donation[]
}

type BloodRequestWithRelations = BloodRequest & {
    recipient: User | null
}

const logger = new Logger('MatchingService')

export class MatchingService {
    private model: tf.LayersModel | null = null

    async initializeModel(): Promise<void> {
        try {
            this.model = await tf.loadLayersModel(
                'indexeddb://bloodchain-matching-model'
            )
            logger.info('✅ ML model loaded from IndexedDB')
        } catch (error) {
            logger.warn('Creating new ML model...')
            this.model = this.buildModel()
            await this.model.save('indexeddb://bloodchain-matching-model')
        }
    }

    private buildModel(): tf.LayersModel {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [8],
                    units: 64,
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({l2: 0.001}),
                }),
                tf.layers.batchNormalization(),
                tf.layers.dropout({rate: 0.3}),
                tf.layers.dense({units: 32, activation: 'relu'}),
                tf.layers.dropout({rate: 0.2}),
                tf.layers.dense({units: 16, activation: 'relu'}),
                tf.layers.dense({units: 1, activation: 'sigmoid'}),
            ],
        })

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy'],
        })

        logger.info('✅ ML model built successfully')
        return model
    }

    async findMatches(
        requestId: string,
        maxResults: number = 10
    ): Promise<AutomatchResult[]> {
        try {
            if (!this.model) {
                await this.initializeModel()
            }

            const request = await prisma.bloodRequest.findUnique({
                where: {id: requestId},
                include: {recipient: true},
            })

            if (!request) {
                throw new Error('Blood request not found')
            }

            // Find eligible donors
            const donors = await prisma.donorProfile.findMany({
                where: {
                    bloodType: request.bloodType,
                    isAvailable: true,
                    user: {blockedFromPlatform: false},
                },
                include: {
                    user: true,
                    donations: {
                        where: {status: 'COMPLETED'},
                        take: 10,
                    },
                },
                take: 100,
            })

            logger.info(`Found ${donors.length} eligible donors for request ${requestId}`)

            // Score each donor
            const results: AutomatchResult[] = []

            for (const donor of donors) {
                const features = await this.extractFeatures(
                    request as BloodRequestWithRelations,
                    donor as DonorProfileWithRelations
                )
                const score = await this.predictScore(features)

                if (score > 0.65) {
                    results.push({
                        matchId: `${requestId}-${donor.id}`,
                        donorId: donor.id,
                        score,
                        features,
                    })
                }
            }

            // Sort by score and return top matches
            const topMatches = results
                .sort((a, b) => b.score - a.score)
                .slice(0, maxResults)

            logger.info(`Generated ${topMatches.length} top matches for request ${requestId}`)
            return topMatches
        } catch (error) {
            logger.error(
                'Matching error:',
                error instanceof Error ? error.message : String(error)
            )
            return []
        }
    }

    private async extractFeatures(
        request: BloodRequestWithRelations,
        donor: DonorProfileWithRelations
    ): Promise<MatchingFeatures> {
        // Calculate success rate
        const successRate =
            donor.donations.length > 0
                ? donor.donations.filter((d) => d.status === 'COMPLETED').length /
                donor.donations.length
                : 0.5

        // Calculate distance (default to 0 if coordinates missing)
        let distanceScore = 1.0
        if (
            request.latitude !== null &&
            request.longitude !== null &&
            donor.latitude !== null &&
            donor.longitude !== null
        ) {
            const distance = GeoUtil.calculateDistance(
                {
                    latitude: request.latitude,
                    longitude: request.longitude,
                },
                {
                    latitude: donor.latitude,
                    longitude: donor.longitude,
                }
            )
            distanceScore = Math.max(0, 1 - distance / 50) // 50km max radius
        }

        // Extract features with null safety
        const features: MatchingFeatures = {
            bloodTypeScore: 1.0, // Perfect match (already filtered)
            distanceScore,
            reputationScore: Math.min((donor.reputationScore || 500) / 1000, 1),
            availabilityScore: donor.isAvailable ? 1.0 : 0,
            urgencyScore: this.getUrgencyMultiplier(request.urgencyLevel),
            successRateScore: successRate,
            responseTimeScore:
                donor.avgResponseTime !== null
                    ? Math.max(0, 1 - donor.avgResponseTime / 3600)
                    : 0.8,
            fraudRiskScore: 1 - Math.min((donor.fraudRiskScore || 0) / 100, 1),
        }

        return features
    }

    private async predictScore(features: MatchingFeatures): Promise<number> {
        if (!this.model) return 0

        const featureArray = Object.values(features)
        const tensor = tf.tensor2d([featureArray])
        const prediction = this.model.predict(tensor) as tf.Tensor
        const score = (await prediction.data())[0]

        tensor.dispose()
        prediction.dispose()

        return score
    }

    private getUrgencyMultiplier(urgency: string): number {
        const multipliers: Record<string, number> = {
            LOW: 0.7,
            MEDIUM: 0.8,
            HIGH: 0.9,
            CRITICAL: 1.0,
            EMERGENCY: 1.0,
        }
        return multipliers[urgency] || 0.7
    }

    async createMatches(results: AutomatchResult[]): Promise<RequestMatch[]> {
        try {
            const matches = await Promise.all(
                results.map((result) => {
                    const [requestId] = result.matchId.split('-')
                    return prisma.requestMatch.create({
                        data: {
                            requestId,
                            donorId: result.donorId,
                            compatibilityScore: result.features.bloodTypeScore,
                            distanceScore: result.features.distanceScore,
                            reputationScore: result.features.reputationScore,
                            availabilityScore: result.features.availabilityScore,
                            urgencyScore: result.features.urgencyScore,
                            successRateScore: result.features.successRateScore,
                            responseTimeScore: result.features.responseTimeScore,
                            fraudRiskScore: result.features.fraudRiskScore,
                            overallScore: result.score,
                            status: 'PENDING',
                            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
                        },
                    })
                })
            )

            logger.info(`✅ Created ${matches.length} matches`)
            return matches
        } catch (error) {
            logger.error(
                'Failed to create matches:',
                error instanceof Error ? error.message : String(error)
            )
            throw error
        }
    }

    async getMatchStats(requestId: string): Promise<Record<string, any>> {
        try {
            const matches = await prisma.requestMatch.findMany({
                where: {requestId},
            })

            const scores = matches.map((m) => m.overallScore)
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length || 0

            return {
                totalMatches: matches.length,
                averageScore: avgScore,
                highQualityMatches: matches.filter((m) => m.overallScore > 0.8).length,
                mediumQualityMatches: matches.filter(
                    (m) => m.overallScore > 0.6 && m.overallScore <= 0.8
                ).length,
            }
        } catch (error) {
            logger.error(
                'Failed to get match stats:',
                error instanceof Error ? error.message : String(error)
            )
            throw error
        }
    }
}

export const matchingService = new MatchingService()
