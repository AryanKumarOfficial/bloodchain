// src/services/reward.service.ts

import {Logger} from '@/lib/utils/logger'
import {prisma} from '@/lib/prisma'

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
    private readonly DONATION_REWARD = 100 // tokens per unit
    private readonly VERIFICATION_REWARD = 25
    private readonly REFERRAL_REWARD = 50

    /**
     * Issue tokens for completed donation
     */
    async issueTokenReward(event: RewardEvent): Promise<void> {
        try {
            const donor = await prisma.donorProfile.findUnique({
                where: {userId: event.userId},
            })

            if (!donor) {
                throw new Error('Donor not found')
            }

            // Update reward balance
            const newTotal = donor.totalRewardsEarned + event.amount

            await prisma.donorProfile.update({
                where: {userId: event.userId},
                data: {
                    totalRewardsEarned: newTotal,
                },
            })

            logger.info('💰 Tokens issued', {
                userId: event.userId,
                amount: event.amount,
                total: newTotal,
                reason: event.description,
            })

            // In production: Call blockchain to mint ERC20 tokens
            // await blockchainService.mintTokens(donor.user.walletAddress, event.amount)
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
            })

            if (!donor) {
                throw new Error('Donor not found')
            }

            // Create NFT metadata
            const metadata = this.generateNFTMetadata(badgeType, donor)

            // In production: Call blockchain to mint NFT
            // const tokenId = await blockchainService.mintNFT(donor.user.walletAddress, metadata)

            const tokenId = `${badgeType}-${Date.now()}-${Math.random()}`

            // Update donor profile
            const updatedNFTs = [...donor.nftBadgesIssued, tokenId]

            await prisma.donorProfile.update({
                where: {userId},
                data: {
                    nftBadgesIssued: updatedNFTs,
                    rewardNFTsMinted: donor.rewardNFTsMinted + 1,
                },
            })

            logger.info('🎁 NFT badge minted', {
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
                description: 'Awarded to donors who have completed 50+ successful donations',
                image: 'ipfs://QmGold...', // IPFS hash
                attributes: {
                    rarity: 'RARE',
                    achievement: 'Gold',
                    donationCount: donor.totalSuccessfulDonations,
                },
            },
            VERIFIED: {
                name: 'Verified Badge',
                description: 'Awarded to donors who passed biometric and identity verification',
                image: 'ipfs://QmVerified...',
                attributes: {
                    rarity: 'COMMON',
                    achievement: 'Verified',
                    verificationDate: new Date().toISOString(),
                },
            },
            AMBASSADOR: {
                name: 'Community Ambassador Badge',
                description: 'Awarded to community leaders and verifiers',
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
