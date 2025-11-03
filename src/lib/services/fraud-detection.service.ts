import { prisma } from '@/lib/prisma'
import { Logger } from '@/lib/utils/logger'
// import { CryptoUtil } from '@/lib/utils/crypto' // Removed, as schema does not support ipHash
import { IFraudScore, FraudDetectedError, IFraudAlert } from '@/types'

/**
 * FRAUD DETECTION SERVICE
 * Autonomous multi-layer fraud detection system
 */

export class FraudDetectionService {
    private logger: Logger = new Logger('FraudDetectionService')
    private readonly FRAUD_THRESHOLD = 0.7
    private readonly HIGH_RISK_THRESHOLD = 0.9

    /**
     * Analyze fraud risk for user
     */
    async analyzeFraudRisk(userId: string, eventData?: Record<string, any>): Promise<IFraudScore> {
        try {
            this.logger.info('Analyzing fraud risk', { userId })

            // 1. Behavioral Analysis
            const behavioralScore = await this.detectBehavioralAnomaly(userId)

            // 2. Device Fingerprinting
            const deviceScore = await this.analyzeDeviceFingerprint(
                eventData || {}
            )

            // 3. Velocity Checks
            const velocityScore = await this.checkVelocityAnomalies(userId)

            // 4. Pattern Analysis
            const patternScore = await this.analyzePatterns(userId)

            // 5. Network Analysis
            // **CHANGED:** No longer passes eventData, as IP hash check is removed
            const networkScore = await this.analyzeNetwork(userId)

            // Calculate composite score (weighted average)
            const totalScore =
                (behavioralScore * 0.2 +
                    deviceScore * 0.15 +
                    velocityScore * 0.25 +
                    patternScore * 0.2 +
                    networkScore * 0.2) /
                5 // This is correct, but weighted sum is 1.0, so dividing by 5 is not a weighted avg.
            // Let's fix this to be a true weighted sum.

            const weightedScore =
                behavioralScore * 0.2 +
                deviceScore * 0.15 +
                velocityScore * 0.25 +
                patternScore * 0.2 +
                networkScore * 0.2; // The weights sum to 1.0

            // Log alert if high risk
            if (weightedScore > this.FRAUD_THRESHOLD) {
                await this.createFraudAlert(userId, weightedScore, eventData)
            }

            // Auto-block if critical
            if (weightedScore > this.HIGH_RISK_THRESHOLD) {
                await this.blockUser(userId, weightedScore)

                throw new FraudDetectedError(
                    `User blocked for critical fraud score: ${weightedScore.toFixed(3)}`,
                )
            }

            this.logger.info('Fraud analysis completed', {
                userId,
                score: weightedScore.toFixed(3),
            })

            return {
                score: weightedScore,
                risk: this.categorizeFraudRisk(weightedScore),
                factors: {
                    behavioral: behavioralScore,
                    device: deviceScore,
                    velocity: velocityScore,
                },
            }
        } catch (error) {
            if (error instanceof FraudDetectedError) {
                this.logger.warn('Fraud analysis resulted in user block', error as Error)
                throw error
            }

            this.logger.error('Fraud analysis error', error as Error)
            return {
                score: 0.5,
                risk: 'medium',
                factors: { behavioral: 0, device: 0, velocity: 0 },
            }
        }
    }

    /**
     * Detect behavioral anomalies
     * (Compatible with schema)
     */
    private async detectBehavioralAnomaly(userId: string): Promise<number> {
        try {
            const recentAttempts = await prisma.verificationAttempt.findMany({
                where: { userId },
                take: 10,
                orderBy: { createdAt: 'desc' },
            })

            if (recentAttempts.length === 0) return 0.2

            const failureRate =
                recentAttempts.filter((a) => a.status === 'REJECTED').length /
                recentAttempts.length

            const trustScores = recentAttempts.map((a) => a.trustScore)
            const avgTrust = trustScores.reduce((a, b) => a + b, 0) / trustScores.length
            const variance =
                trustScores.reduce((sum, score) => sum + Math.pow(score - avgTrust, 2), 0) /
                trustScores.length
            const stdDev = Math.sqrt(variance)
            const varianceScore = Math.min(stdDev, 1)

            return Math.min((failureRate + varianceScore) / 2, 1)
        } catch (error) {
            this.logger.error('Behavioral anomaly detection error', error as Error)
            return 0
        }
    }

    /**
     * Analyze device fingerprint
     * (Compatible with schema - no DB access)
     */
    private async analyzeDeviceFingerprint(eventData: Record<string, any>): Promise<number> {
        try {
            let score = 0.1
            if (eventData.device?.newDevice) score += 0.2
            if (eventData.device?.vpnDetected) score += 0.3
            if (eventData.device?.proxyDetected) score += 0.25
            if (eventData.device?.rootedDevice) score += 0.25
            if (eventData.device?.emulator) score += 0.3
            if (eventData.device?.sharedDevice) score += 0.4
            if (eventData.device?.multipleUsers) score += 0.3
            return Math.min(score, 1)
        } catch (error) {
            this.logger.error('Device fingerprint analysis error', error as Error)
            return 0
        }
    }

    /**
     * Check velocity anomalies
     * (Compatible with schema)
     */
    private async checkVelocityAnomalies(userId: string): Promise<number> {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

            const recentRequests = await prisma.verificationAttempt.count({
                where: { userId, createdAt: { gte: oneHourAgo } },
            })

            const veryRecentRequests = await prisma.verificationAttempt.count({
                where: { userId, createdAt: { gte: fiveMinutesAgo } },
            })

            if (veryRecentRequests > 3) return 0.95
            if (recentRequests > 10) return 0.8
            if (recentRequests > 5) return 0.5
            return 0.1
        } catch (error) {
            this.logger.error('Velocity anomaly detection error', error as Error)
            return 0
        }
    }

    /**
     * Analyze usage patterns
     * (Compatible with schema)
     */
    private async analyzePatterns(userId: string): Promise<number> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { donations: { orderBy: { createdAt: 'desc' } }, verifications: true },
            })

            if (!user) return 0.5

            let score = 0
            const accountAgeDays =
                (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            if (accountAgeDays < 7) score += 0.3

            if (!user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > 30 * 24 * 60 * 60 * 1000) {
                score += 0.2
            }

            const donations = user.donations || []
            if (donations.length > 5) {
                const timeDiffs: number[] = []
                for (let i = 1; i < donations.length; i++) {
                    // Corrected order: recent (i-1) - older (i)
                    timeDiffs.push(
                        donations[i - 1].createdAt.getTime() -
                        donations[i].createdAt.getTime()
                    )
                }

                const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
                const variance =
                    timeDiffs.reduce(
                        (sum, diff) => sum + Math.pow(diff - avgTimeDiff, 2),
                        0
                    ) / timeDiffs.length

                if (Math.sqrt(variance) < 24 * 60 * 60 * 1000) {
                    score += 0.3
                }
            }
            return Math.min(score, 1)
        } catch (error) {
            this.logger.error('Pattern analysis error', error as Error)
            return 0
        }
    }

    /**
     * Analyze network relationships
     * **FIXED:** Removed IP hash check to match schema
     */
    private async analyzeNetwork(userId: string): Promise<number> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    donations: {
                        include: { donor: true },
                    },
                },
            })

            if (!user) return 0

            let score = 0
            const relatedUserIds: Set<string> = new Set()

            // **REMOVED** the CryptoUtil/ipHash check as the field doesn't exist

            for (const donation of user.donations || []) {
                if (donation.donor?.blockedFromPlatform) {
                    score += 0.3
                }
                relatedUserIds.add(donation.donor?.id || '')
            }

            const flaggedCount = await prisma.user.count({
                where: {
                    id: { in: Array.from(relatedUserIds).filter(id => id) },
                    blockedFromPlatform: true,
                },
            })

            if (flaggedCount > 2) {
                score += 0.4
            }

            return Math.min(score, 1)
        } catch (error) {
            this.logger.error('Network analysis error', error as Error)
            return 0
        }
    }

    /**
     * Categorize fraud risk
     */
    private categorizeFraudRisk(score: number): 'low' | 'medium' | 'high' | 'critical' {
        if (score < 0.3) return 'low'
        if (score < 0.6) return 'medium'
        if (score < 0.85) return 'high'
        return 'critical'
    }

    /**
     * Create fraud alert
     * (Compatible with schema)
     */
    private async createFraudAlert(
        userId: string,
        fraudScore: number,
        eventData?: Record<string, any>
    ): Promise<IFraudAlert> {
        try {
            const alert = await prisma.fraudAlert.create({
                data: {
                    userId,
                    alertType: eventData?.event || 'AUTONOMOUS_FRAUD_DETECTION',
                    severity: fraudScore > this.HIGH_RISK_THRESHOLD ? 'CRITICAL' : 'HIGH',
                    description: `Fraud score: ${fraudScore.toFixed(3)}. Event: ${eventData?.event || 'unknown'}`,
                    fraudScore,
                    blockchainAttested: false, // Defaulting to false, as this is an off-chain alert
                },
            })

            this.logger.warn('Fraud alert created', {
                alertId: alert.id,
                userId,
                score: fraudScore,
            })

            // We must cast here because the returned type is the raw Prisma model
            return alert as IFraudAlert
        } catch (error) {
            this.logger.error('Failed to create fraud alert', error as Error)
            throw error
        }
    }

    /**
     * Block user from platform
     * (Compatible with schema)
     */
    private async blockUser(userId: string, fraudScore: number): Promise<void> {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { blockedFromPlatform: true },
            })

            this.logger.critical(
                'User blocked due to high fraud score',
                new Error(`Fraud score: ${fraudScore.toFixed(3)}`)
            )
        } catch (error) {
            this.logger.error('Failed to block user', error as Error)
        }
    }
}

export const fraudDetectionService = new FraudDetectionService()
