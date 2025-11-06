// src/jobs/autonomous-matching.job.ts

import { prisma } from '@/lib/prisma'
import { matchingService } from '@/lib/services/matching.service'
import { notificationService } from '@/lib/services/notification.service'
import { Logger } from '@/lib/utils/logger'

const logger = new Logger('AutonomousMatchingJob')

/**
 * Run every 5 minutes
 * Automatically match open blood requests with available donors
 */
export async function runAutonomousMatchingJob() {
    try {
        logger.info('🔄 Starting autonomous matching job...')

        // Initialize AI model
        await matchingService.initializeModel()

        // Find open requests expiring soon
        const now = new Date()
        const expiringSoon = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours

        const openRequests = await prisma.bloodRequest.findMany({
            where: {
                status: 'OPEN',
                expiresAt: { gt: now, lt: expiringSoon },
            },
        })

        logger.info(`📋 Found ${openRequests.length} open requests`)

        for (const request of openRequests) {
            try {
                // Find matches
                const matches = await matchingService.findMatches(request.id, 5)

                if (matches.length === 0) {
                    logger.warn(`No matches found for request ${request.id}`)

                    // Broadcast urgent alert
                    if (request.urgencyLevel === 'EMERGENCY') {
                        await notificationService.broadcastUrgentRequest(
                            request.id,
                            request.latitude || 0,
                            request.longitude || 0,
                            request.urgencyLevel
                        )
                    }
                    continue
                }

                // Create match records
                await matchingService.createMatches(matches)

                logger.info(`✅ Created ${matches.length} matches for request ${request.id}`)
            } catch (error) {
                logger.error(`Failed to process request ${request.id}:`, error as Error)
            }
        }

        logger.info('✅ Autonomous matching job completed')
    } catch (error) {
        logger.critical('Autonomous matching job failed:', error as Error)
    }
}
