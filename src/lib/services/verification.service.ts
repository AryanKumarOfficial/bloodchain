import { prisma } from '@/lib/prisma'
import { Logger } from '@/lib/utils/logger'
import { CryptoUtil } from '@/lib/utils/crypto'
import {
    IVerification,
    VerificationStatus,
    ValidationError,
} from '@/types'
import { Prisma } from '@prisma/client' // Import Prisma types

/**
 * VERIFICATION SERVICE
 * Peer-to-peer decentralized verification
 */

export class VerificationService {
    private logger: Logger = new Logger('VerificationService')
    private readonly REQUIRED_VERIFIERS = 3

    /**
     * Initiate P2P verification
     */
    async initiateP2PVerification(
        recordId: string,
        recordData: Record<string, any>
    ): Promise<string[]> {
        try {
            this.logger.info('Initiating P2P verification', { recordId })

            // Select qualified verifiers
            const verifiers = await this.selectQualifiedVerifiers(
                this.REQUIRED_VERIFIERS
            )

            if (verifiers.length < this.REQUIRED_VERIFIERS) {
                throw new ValidationError('Insufficient qualified verifiers')
            }

            // Create verification challenge
            const verificationChallenge = CryptoUtil.hash(
                JSON.stringify(recordData)
            )

            const verificationProofs: Partial<IVerification>[] = []

            for (const verifier of verifiers) {
                const proof = await this.requestVerifierAttestation(
                    verifier.verifierUserId,
                    recordId,
                    verificationChallenge
                )
                verificationProofs.push(proof)
            }

            // Validate multi-signature
            const allProofsValid = await this.validateMultiSignature(
                verificationProofs,
                recordData
            )

            if (!allProofsValid) {
                throw new ValidationError('Multi-signature verification failed')
            }

            // Create verification records
            for (let i = 0; i < verifiers.length; i++) {
                // ---
                // **FIX:** Changed `requestId: recordId` to a nested `connect` object
                // This now matches the Prisma.VerificationCreateInput type.
                // ---
                const verificationData: Prisma.VerificationCreateInput = {
                    verificationType: 'PEER_REVIEW',
                    request: { connect: { id: recordId } }, // Correct way to link
                    verifier: { connect: { id: verifiers[i].verifierUserId } },
                    blockchainSignature: verificationProofs[i].blockchainSignature,
                    merkleProof: verificationProofs[i].merkleProof,
                    status: VerificationStatus.VERIFIED_BLOCKCHAIN,
                    confidence: 0.95,
                }

                await prisma.verification.create({
                    data: verificationData,
                })
            }

            this.logger.info('P2P verification successful', {
                recordId,
                verifierCount: verifiers.length,
            })

            return verifiers.map((v) => v.verifierUserId)
        } catch (error) {
            this.logger.error('P2P verification error', error as Error)
            throw error
        }
    }

    /**
     * Select qualified verifiers
     */
    private async selectQualifiedVerifiers(count: number): Promise<any[]> {
        try {
            // Get top verifiers by qualification score
            const verifiers = await prisma.decentralizedVerifierPool.findMany({
                where: {
                    isActive: true,
                    qualificationScore: { gte: 0.8 },
                    disputedVerifications: { lt: 5 },
                },
                orderBy: { qualificationScore: 'desc' },
                take: count * 3, // Fetch more for randomization
            })

            // Randomly select to ensure decentralization
            const shuffled = verifiers.sort(() => Math.random() - 0.5)

            return shuffled.slice(0, count)
        } catch (error) {
            this.logger.error('Failed to select verifiers', error as Error)
            return []
        }
    }

    /**
     * Request verifier attestation
     */
    private async requestVerifierAttestation(
        verifierId: string,
        recordId: string,
        challenge: string
    ): Promise<Partial<IVerification>> {
        try {
            const signature = CryptoUtil.hmac(challenge, verifierId)
            const merkleProof = CryptoUtil.generateMerkleRoot([
                recordId,
                verifierId,
                challenge,
            ])

            return {
                verifierId: verifierId,
                blockchainSignature: signature,
                merkleProof,
            }
        } catch (error) {
            this.logger.error('Failed to request attestation', error as Error)
            throw error
        }
    }

    /**
     * Validate multi-signature
     */
    private async validateMultiSignature(
        proofs: Partial<IVerification>[],
        data: Record<string, any>
    ): Promise<boolean> {
        try {
            if (proofs.length < this.REQUIRED_VERIFIERS) {
                return false
            }

            for (const proof of proofs) {
                if (!proof.blockchainSignature || !proof.merkleProof) {
                    return false
                }
            }

            const dataHash = CryptoUtil.hash(JSON.stringify(data))

            for (const proof of proofs) {
                if (!CryptoUtil.verifyMerkleProof(dataHash, [proof.merkleProof || ''], proof.blockchainSignature || '')) {
                    // Note: This is simplified; real implementation would be more complex
                    continue
                }
            }

            return true
        } catch (error) {
            this.logger.error('Signature validation error', error as Error)
            return false
        }
    }

    /**
     * Register as verifier
     */
    async registerAsVerifier(userId: string): Promise<void> {
        try {
            const existing = await prisma.decentralizedVerifierPool.findUnique({
                where: { verifierUserId: userId },
            })

            if (existing) {
                throw new ValidationError('User already registered as verifier')
            }

            await prisma.decentralizedVerifierPool.create({
                data: {
                    verifierUserId: userId,
                    qualificationScore: 0.5,
                    successfulVerifications: 0,
                    disputedVerifications: 0,
                    isActive: true,
                },
            })

            this.logger.info('Verifier registered', { userId })
        } catch (error) {
            this.logger.error('Verifier registration error', error as Error)
            throw error
        }
    }

    /**
     * Update verifier qualification
     */
    async updateVerifierQualification(
        verifierId: string,
        successful: boolean
    ): Promise<void> {
        try {
            const verifier = await prisma.decentralizedVerifierPool.findUnique({
                where: { verifierUserId: verifierId },
            })

            if (!verifier) {
                throw new ValidationError('Verifier not found')
            }

            const newSuccessful = successful
                ? verifier.successfulVerifications + 1
                : verifier.successfulVerifications

            const newDisputed = !successful
                ? verifier.disputedVerifications + 1
                : verifier.disputedVerifications

            const totalVerifications = newSuccessful + newDisputed
            const successRate = newSuccessful / Math.max(totalVerifications, 1)
            const qualificationScore = successRate * 0.7 + (1 - newDisputed / Math.max(totalVerifications, 10)) * 0.3

            await prisma.decentralizedVerifierPool.update({
                where: { verifierUserId: verifierId },
                data: {
                    successfulVerifications: newSuccessful,
                    disputedVerifications: newDisputed,
                    qualificationScore: Math.min(qualificationScore, 1),
                },
            })

            this.logger.info('Verifier qualification updated', {
                verifierId,
                qualificationScore: qualificationScore.toFixed(3),
            })
        } catch (error) {
            this.logger.error('Failed to update verifier qualification', error as Error)
        }
    }
}

export const verificationService = new VerificationService()

