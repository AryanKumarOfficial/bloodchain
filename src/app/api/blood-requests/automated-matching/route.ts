// app/api/blood-requests/automated-matching/route.ts

import {NextRequest, NextResponse} from 'next/server'
import {getServerSession} from 'next-auth'
import {authOptions} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {matchingService} from '@/lib/services/matching.service'
import {notificationService} from '@/lib/services/notification.service'
import {Logger} from '@/lib/utils/logger'

const logger = new Logger('AutomatedMatchingAPI')

/**
 * POST /api/blood-requests/automated-matching
 * Triggers autonomous AI matching for a blood request
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

        const {requestId} = await request.json()

        // Get blood request
        const bloodRequest = await prisma.bloodRequest.findUnique({
            where: {id: requestId},
            include: {recipient: true},
        })

        if (!bloodRequest) {
            return NextResponse.json(
                {error: 'Request not found'},
                {status: 404}
            )
        }

        logger.info('🔄 Starting automated matching', {requestId})

        // Initialize ML model
        await matchingService.initializeModel()

        // Find matches using AI
        const matches = await matchingService.findMatches(requestId, 10)

        if (matches.length === 0) {
            logger.warn('⚠️ No matches found', {requestId})
            return NextResponse.json(
                {success: true, matchCount: 0, message: 'No suitable matches found'},
                {status: 200}
            )
        }

        // Create match records
        const createdMatches = await matchingService.createMatches(matches)

        // Notify top donor
        if (createdMatches.length > 0) {
            const topMatch = createdMatches[0]
            const donor = await prisma.donorProfile.findUnique({
                where: {id: topMatch.donorId},
                include: {user: true},
            })

            if (donor?.user?.email) {
                await notificationService.sendEmailNotification(donor.user.email, {
                    userId: donor.userId,
                    type: 'MATCH_FOUND',
                    title: '🎉 You Have a New Match!',
                    message: `Your profile matches a blood request. Score: ${(topMatch.overallScore * 100).toFixed(0)}%`,
                    data: {matchId: topMatch.id, requestId},
                })
            }
        }

        logger.info('✅ Automated matching completed', {
            requestId,
            matchCount: createdMatches.length,
        })

        return NextResponse.json(
            {
                success: true,
                matchCount: createdMatches.length,
                matches: createdMatches.map((m) => ({
                    id: m.id,
                    score: m.overallScore,
                })),
            },
            {status: 200}
        )
    } catch (error) {
        logger.error('Automated matching error: ' + (error as Error).message)
        return NextResponse.json(
            {error: 'Failed to process matching'},
            {status: 500}
        )
    }
}
