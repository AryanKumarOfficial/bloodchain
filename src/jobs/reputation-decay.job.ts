// src/jobs/reputation-decay.job.ts

import { prisma } from '@/lib/prisma'
import { Logger } from '@/lib/utils/logger'

const logger = new Logger('ReputationDecayJob')

/**
 * Run daily
 * Reduce reputation score for inactive donors
 */
export async function runReputationDecayJob() {
    try {
        logger.info('📉 Starting reputation decay job...')

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

        // Find inactive donors
        const inactiveDonors = await prisma.donorProfile.findMany({
            where: {
                lastDonationDate: { lt: thirtyDaysAgo },
            },
        })

        logger.info(`Found ${inactiveDonors.length} inactive donors`)

        for (const donor of inactiveDonors) {
            // Reduce reputation by 5% monthly
            const newScore = Math.max(
                0,
                Math.floor(donor.aiReputationScore * 0.95)
            )

            await prisma.donorProfile.update({
                where: { id: donor.id },
                data: { aiReputationScore: newScore },
            })

            logger.info(
                `Updated ${donor.userId}: ${donor.aiReputationScore} -> ${newScore}`
            )
        }

        logger.info('✅ Reputation decay job completed')
    } catch (error) {
        logger.critical('Reputation decay job failed:', error as Error)
    }
}
