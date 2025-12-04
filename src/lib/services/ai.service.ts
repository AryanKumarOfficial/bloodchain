// src/lib/services/ai.service.ts

import * as tf from '@tensorflow/tfjs'
import {prisma} from '@/lib/prisma'
import {Logger} from '@/lib/utils/logger'
import {IAIFeatureVector, IAIMatchingScore, IBloodRequest, IDonorProfile,} from '@/types'
import path from 'path'
import fs from "fs";

/**
 * AI MATCHING SERVICE
 * Machine learning-based donor matching and autonomous decisions
 */

export class AIService {
    private logger: Logger = new Logger('AIService')
    private model: tf.LayersModel | null = null
    private donorLocations: Map<string, { lat: number, lon: number }> = new Map();

    /**
     * Initialize AI model
     */
    async initializeModel(): Promise<void> {
        try {
            if (this.model) return

            this.logger.info('Initializing AI model...')

            const modelDir = path.join(process.cwd(), 'ml-models/trained');
            const modelJsonPath = path.join(modelDir, 'model.json');
            const weightsPath = path.join(modelDir, 'weights.bin');

            try {
                if (fs.existsSync(modelJsonPath) && fs.existsSync(weightsPath)) {
                    try {
                        // 1. Read and parse model.json
                        const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));

                        // 2. Read weights file
                        const weightsBuffer = fs.readFileSync(weightsPath);
                        // Convert Node Buffer to ArrayBuffer
                        const weightsArrayBuffer = weightsBuffer.buffer.slice(
                            weightsBuffer.byteOffset,
                            weightsBuffer.byteOffset + weightsBuffer.byteLength
                        );

                        // 3. Extract weight specs from the manifest
                        // model.json structure: { modelTopology: ..., weightsManifest: [{ weights: [...] }] }
                        const weightSpecs = modelJson.weightsManifest?.[0]?.weights;

                        if (!weightSpecs) {
                            throw new Error('Invalid model.json: missing weightsManifest');
                        }

                        // 4. Load using tf.io.fromMemory with 3 arguments
                        // Signature: (modelTopology, weightSpecs, weightData)
                        const loadHandler = tf.io.fromMemory(
                            modelJson.modelTopology,
                            weightSpecs,
                            weightsArrayBuffer
                        );

                        this.model = await tf.loadLayersModel(loadHandler);
                        this.logger.info('Model loaded from File System (Manual Handler)')
                    } catch (loadError) {
                        this.logger.error('Failed to load model from disk', loadError as Error);
                        this.createFallbackModel();
                    }
                } else {
                    this.logger.warn('Model files not found. Creating fallback model...');
                    this.createFallbackModel();
                }
            } catch (error) {
                this.logger.warn('Model not found on disk. Building new AI model...', {error: (error as Error).message})
                this.model = this.buildModel()
                // Save attempt (will fail if tfjs-node is missing, but app will continue with in-memory model)
                try {
                    await this.model.save(`file://${path.dirname(modelJsonPath)}`)
                } catch (e) {
                    this.logger.warn('Could not save model to disk (missing tfjs-node fs handler?)');
                }
            }
        } catch (error) {
            this.logger.error('Failed to initialize model', error as Error)
            throw error
        }
    }


    private createFallbackModel() {
        this.model = this.buildModel();
        // We do not save to disk here to avoid write permission issues in some containers
        this.logger.info('Fallback in-memory model created');
    }

    /**
     * Build neural network model
     */
    private buildModel(): tf.LayersModel {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [10],
                    units: 64,
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({l2: 0.001}),
                }),
                tf.layers.batchNormalization(),
                tf.layers.dropout({rate: 0.3}),
                tf.layers.dense({
                    units: 32,
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({l2: 0.001}),
                }),
                tf.layers.dropout({rate: 0.2}),
                tf.layers.dense({
                    units: 16,
                    activation: 'relu',
                }),
                tf.layers.dense({
                    units: 1,
                    activation: 'sigmoid',
                }),
            ],
        })

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy'],
        })

        this.logger.info('Model built successfully')
        return model
    }

    async updateDonorLocation(userId: string, lat: number, lon: number): Promise<void> {
        this.donorLocations.set(userId, {lat, lon});
        this.logger.debug('Updated donor location cache', {userId});
    }

    private getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private async extractFeatures(
        request: IBloodRequest,
        donor: IDonorProfile
    ): Promise<IAIFeatureVector> {
        return {
            bloodTypeCompatibility: 1.0,
            rhFactorCompatibility: 1.0,
            donorReputationScore: Math.min(donor.aiReputationScore, 1.0),
            donorAvailability: donor.isAvailable ? 1.0 : 0.0,
            successRate:
                donor.totalSuccessfulDonations /
                Math.max(
                    donor.totalSuccessfulDonations + donor.totalFailedMatches,
                    1
                ),
            responseTimeNormalized: Math.max(
                0,
                1.0 - (donor.avgResponseTime || 0) / 3600
            ),
            daysSinceLastDonation: Math.min(
                (Date.now() - (donor.lastDonationDate?.getTime() || 0)) /
                (90 * 24 * 60 * 60 * 1000),
                1.0
            ),
            urgencyLevel: Math.min(this.urgencyToNumber(request.urgencyLevel) / 5, 1.0),
            fraudRiskInverse: 1.0 - Math.min(donor.fraudRiskScore, 1.0),
            biometricVerification: donor.biometricVerified ? 1.0 : 0.5,
        }
    }

    private urgencyToNumber(urgency: string): number {
        const urgencyMap: Record<string, number> = {
            LOW: 1,
            MEDIUM: 2,
            HIGH: 3,
            CRITICAL: 4,
            EMERGENCY: 5,
        }
        return urgencyMap[urgency] || 1
    }

    private featuresToArray(features: IAIFeatureVector): number[] {
        return [
            features.bloodTypeCompatibility,
            features.rhFactorCompatibility,
            features.donorReputationScore,
            features.donorAvailability,
            features.successRate,
            features.responseTimeNormalized,
            features.daysSinceLastDonation,
            features.urgencyLevel,
            features.fraudRiskInverse,
            features.biometricVerification,
        ]
    }

    async predictMatchingScore(
        request: IBloodRequest,
        donor: IDonorProfile
    ): Promise<number> {
        try {
            if (!this.model) {
                await this.initializeModel()
            }

            const features = await this.extractFeatures(request, donor)
            const featureArray = this.featuresToArray(features)

            const predictions = this.model!.predict(
                tf.tensor2d([featureArray])
            ) as tf.Tensor

            const score = await predictions.data()
            predictions.dispose()

            return score[0]
        } catch (error) {
            this.logger.error('Failed to predict matching score', error as Error)
            return 0
        }
    }

    async autonomousMatching(requestId: string): Promise<IAIMatchingScore[]> {
        try {
            this.logger.info('Running autonomous matching', {requestId})

            const request = await prisma.bloodRequest.findUnique({
                where: {id: requestId},
            })

            if (!request || !request.latitude || !request.longitude) {
                throw new Error('Request not found or has no location')
            }

            const donors = await prisma.donorProfile.findMany({
                where: {
                    bloodType: request.bloodType,
                    isAvailable: true,
                    user: {blockedFromPlatform: false},
                },
                include: {user: true},
                take: 100,
            })

            const scores: IAIMatchingScore[] = []

            for (const donor of donors) {
                const donorLocation = this.donorLocations.get(donor.userId);

                if (!donorLocation) {
                    continue;
                }

                const distance = this.getDistanceInKm(
                    request.latitude,
                    request.longitude,
                    donorLocation.lat,
                    donorLocation.lon
                );

                if (distance > request.radius) {
                    continue;
                }

                const aiScore = await this.predictMatchingScore(request as IBloodRequest, donor as IDonorProfile)
                const distanceScore = Math.max(0, 1 - (distance / request.radius));

                if (aiScore > 0.7) {
                    scores.push({
                        donorId: donor.user?.id || '',
                        userId: donor.userId,
                        distance: distance,
                        aiScore,
                        reputation: donor.aiReputationScore,
                        compatibilityScore: 1.0,
                        distanceScore: distanceScore,
                        reputationScore: donor.aiReputationScore,
                        availabilityScore: 0.9,
                        responseScore: Math.max(0, 1.0 - (donor.avgResponseTime || 0) / 3600),
                        overallScore: aiScore * 0.6 + distanceScore * 0.4,
                    })
                }
            }

            const topMatches = scores
                .sort((a, b) => b.overallScore - a.overallScore)
                .slice(0, 10)

            this.logger.info('Autonomous matching completed', {
                requestId,
                matchCount: topMatches.length,
            })

            return topMatches
        } catch (error) {
            this.logger.error('Autonomous matching failed', error as Error)
            return []
        }
    }
}

export const aiService = new AIService()