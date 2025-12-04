'use server'

import {getServerSession} from 'next-auth'
import {authOptions} from '@/lib/auth'
import {DashboardStats} from '../types/dashboard'
import {logToServer} from './log.action'
import {LogLevel} from '@/types/logger'
import {prisma} from '@/lib/prisma'
import {RequestStatus, DonationStatus} from '@prisma/client'

export const getDashboardStats = async (): Promise<DashboardStats> => {
    // 1. Validate session
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        throw new Error('Unauthorized')
    }
    if (!session?.user?.id) {
        throw new Error('Malformed')
    }

    try {
        // 2. Query Database Directly (No fetch)
        // Active = OPEN blood requests
        const activeRequests = await prisma.bloodRequest.count({
            where: {
                status: RequestStatus.OPEN,
                recipient: {
                    id: session?.user?.id,
                }
            },
        })

        // Matched donors = blood requests that are MATCHED
        const matchedDonors = await prisma.bloodRequest.count({
            where: {
                status: RequestStatus.MATCHED,
                recipient: {
                    id: session?.user?.id,
                }
            },
        })

        // Completed donations
        const completedDonations = await prisma.donation.count({
            where: {
                status: DonationStatus.COMPLETED,
                donor: {
                    id: session?.user?.id,
                }
            },
        })

        // Total rewards
        const rewardsAgg = await prisma.donation.aggregate({
            _sum: {
                rewardTokensIssued: true,
            },
        })

        const totalRewards = rewardsAgg._sum.rewardTokensIssued ?? 0

        // Log success
        await logToServer(LogLevel.INFO, 'Dashboard stats fetched via Server Action')

        return {
            activeRequests,
            matchedDonors,
            completedDonations,
            totalRewards,
        }

    } catch (error) {
        // Log the error
        await logToServer(LogLevel.ERROR, 'Failed to fetch dashboard stats', {
            error: error instanceof Error ? error.message : 'Unknown error'
        })

        throw new Error('Could not fetch dashboard statistics.')
    }
}