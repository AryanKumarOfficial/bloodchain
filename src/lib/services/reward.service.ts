// src/lib/services/reward.service.ts

import {Logger} from '@/lib/utils/logger'
import {prisma} from '@/lib/prisma'
import {blockchainService} from '@/lib/services/blockchain.service'

interface RewardEvent {
    userId: string
    eventType: 'DONATION_COMPLETED' | 'VERIFICATION' | 'REFERRAL'
    amount: number
    description: string
}

interface NFTMetadata {
    name: string
    description: string
    image: string
    attributes: Record<string, any>
}

const logger = new Logger('RewardService')

export class RewardService {
    /**
     * Issue tokens for completed donation
     */
    async issueTokenReward(event: RewardEvent): Promise<void> {
        try {
            const donor = await prisma.donorProfile.findUnique({
                where: {userId: event.userId},
                include: { user: true } // PATCH: Include user to get wallet address
            })

            if (!donor) {
                throw new Error('Donor not found')
            }

            // Update reward balance in DB
            const newTotal = donor.totalRewardsEarned + event.amount

            await prisma.donorProfile.update({
                where: {userId: event.userId},
                data: {
                    totalRewardsEarned: newTotal,
                },
            })

            logger.info('💰 Tokens recorded in DB', {
                userId: event.userId,
                amount: event.amount,
                total: newTotal,
            })

            // PATCH: Execute Real Blockchain Transaction
            if (donor.user.walletAddress) {
                try {
                    // Send tokens from platform treasury to donor
                    const txHash = await blockchainService.transferTokens(
                        donor.user.walletAddress,
                        event.amount
                    );
                    logger.info('⛓️ Blockchain tokens transferred', { txHash });
                } catch (bcError) {
                    // Don't crash the request if blockchain fails, but log critical error
                    logger.error('Blockchain transfer failed (Retry needed):', bcError as Error);
                }
            } else {
                logger.warn('Skipping blockchain transfer: Donor has no wallet address');
            }

        } catch (error) {
            logger.error('Failed to issue token reward: ' + (error as Error).message)
            throw error
        }
    }

    /**
     * Mint NFT badge for achievement
     */
    async mintNFTBadge(
        userId: string,
        badgeType: 'GOLD_DONOR' | 'VERIFIED' | 'AMBASSADOR'
    ): Promise<string> {
        try {
            const donor = await prisma.donorProfile.findUnique({
                where: {userId},
                include: { user: true }
            })

            if (!donor) {
                throw new Error('Donor not found')
            }

            // Create NFT metadata
            const metadata = this.generateNFTMetadata(badgeType, donor)

            // PATCH: Real Blockchain Interaction placeholder
            // Note: Since mintNFT logic requires a specific contract method not in the service yet,
            // we will simulate the ID generation but keep the structure ready for the call.
            // const tokenId = await blockchainService.mintNFT(donor.user.walletAddress, metadata)

            const tokenId = `${badgeType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

            // Update donor profile
            const updatedNFTs = [...donor.nftBadgesIssued, tokenId]

            await prisma.donorProfile.update({
                where: {userId},
                data: {
                    nftBadgesIssued: updatedNFTs,
                    rewardNFTsMinted: donor.rewardNFTsMinted + 1,
                },
            })

            logger.info('🎁 NFT badge minted (DB)', {
                userId,
                badgeType,
                tokenId,
            })

            return tokenId
        } catch (error) {
            logger.error('Failed to mint NFT badge: ' + (error as Error).message)
            throw error
        }
    }

    /**
     * Generate NFT metadata
     */
    private generateNFTMetadata(
        badgeType: string,
        donor: any
    ): NFTMetadata {
        const metadata: Record<string, NFTMetadata> = {
            GOLD_DONOR: {
                name: 'Gold Donor Badge',
                description: 'Awarded to donors who have completed 10+ successful donations',
                image: 'ipfs://QmGold...',
                attributes: {
                    rarity: 'RARE',
                    achievement: 'Gold',
                    donationCount: donor.totalSuccessfulDonations,
                },
            },
            VERIFIED: {
                name: 'Verified Badge',
                description: 'Awarded to donors who passed biometric verification',
                image: 'ipfs://QmVerified...',
                attributes: {
                    rarity: 'COMMON',
                    achievement: 'Verified',
                    verificationDate: new Date().toISOString(),
                },
            },
            AMBASSADOR: {
                name: 'Community Ambassador Badge',
                description: 'Awarded to community leaders',
                image: 'ipfs://QmAmbassador...',
                attributes: {
                    rarity: 'EPIC',
                    achievement: 'Ambassador',
                    role: 'Community Leader',
                },
            },
        }

        return metadata[badgeType] || metadata.VERIFIED
    }
}

export const rewardService = new RewardService()