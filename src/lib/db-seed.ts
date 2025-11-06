// src/lib/db-seed.ts

import { prisma } from '@/lib/prisma'
import { Logger } from '@/lib/utils/logger'

const logger = new Logger('DatabaseSeed')

export async function seedDatabase() {
    try {
        logger.info('🌱 Seeding database...')

        // Create test users
        const testUser = await prisma.user.create({
            data: {
                email: 'donor@test.com',
                passwordHash: 'hashed_password',
                name: 'Test Donor',
                phone: '+1234567890',
                role: 'DONOR',
                verificationStatus: 'VERIFIED_BLOCKCHAIN',
            },
        })

        // Create donor profile
        await prisma.donorProfile.create({
            data: {
                userId: testUser.id,
                bloodType: 'O_POSITIVE',
                rhFactor: 'POSITIVE',
                isAvailable: true,
                aiReputationScore: 0.85,
                totalSuccessfulDonations: 10,
                ReputationScore: 850,
            },
        })

        logger.info('✅ Database seeding completed')
    } catch (error) {
        logger.error('Database seeding failed:', error as Error)
    }
}

// Run seed on startup if needed
if (require.main === module) {
    seedDatabase().then(() => process.exit(0))
}
