
import {NextRequest, NextResponse} from 'next/server'
import {getServerSession} from 'next-auth'
import {authOptions} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {Logger} from '@/lib/utils/logger'
import {blockchainService} from "@/lib/services/blockchain.service";

const logger = new Logger('RewardClaimAPI')

/**
 * POST /api/rewards/claim
 * Claim pending token rewards
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                {error: 'Unauthorized'},
                {status: 401}
            )
        }

        const donor = await prisma.donorProfile.findUnique({
            where: {userId: session.user.id},
            include: {
                user: true
            }
        })

        if (!donor) {
            return NextResponse.json(
                {error: 'Donor profile not found'},
                {status: 404}
            )
        }

        const pendingRewards = donor.totalRewardsEarned

        if (pendingRewards === 0) {
            return NextResponse.json(
                {error: 'No pending rewards'},
                {status: 400}
            )
        }

        logger.info('💰 Processing reward claim', {
            userId: session.user.id,
            amount: pendingRewards,
        })

        if (!donor.user.walletAddress) {
            return NextResponse.json(
                {error: 'Wallet address not found'},
                {status: 400}
            )
        }

        const txHash = await blockchainService.transferTokens(
            donor.user.walletAddress,
            pendingRewards
        )


        // Update donor profile
        await prisma.donorProfile.update({
            where: {id: donor.id},
            data: {
                totalRewardsEarned: 0, // Reset after claiming
            },
        })

        logger.info('✅ Rewards claimed', {
            userId: session.user.id,
            amount: pendingRewards,
            txHash,
        })

        return NextResponse.json(
            {
                success: true,
                claimedAmount: pendingRewards,
                transactionHash: txHash,
                message: 'Rewards claimed successfully',
            },
            {status: 200}
        )
    } catch (error) {
        logger.error('Reward claim error: ' + (error as Error).message)
        return NextResponse.json(
            {error: 'Failed to claim rewards'},
            {status: 500}
        )
    }
}

/**
 * GET /api/rewards/claim
 * Get pending rewards
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                {error: 'Unauthorized'},
                {status: 401}
            )
        }

        const donor = await prisma.donorProfile.findUnique({
            where: {userId: session.user.id},
        })

        if (!donor) {
            return NextResponse.json(
                {error: 'Donor profile not found'},
                {status: 404}
            )
        }

        return NextResponse.json(
            {
                pendingRewards: donor.totalRewardsEarned,
                nftBadges: donor.nftBadgesIssued,
                totalMinted: donor.rewardNFTsMinted,
            },
            {status: 200}
        )
    } catch (error) {
        logger.error('Failed to fetch rewards: ' + (error as Error).message)
        return NextResponse.json(
            {error: 'Failed to fetch rewards'},
            {status: 500}
        )
    }
}
