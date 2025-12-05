// src/lib/db-seed.ts

import {
    PrismaClient,
    UserRole,
    VerificationStatus,
    BloodType,
    RequestStatus,
    MatchStatus,
    DonationStatus,
    User,
    DonorProfile
} from '@prisma/client'
import {prisma} from '@/lib/prisma'
import {Logger} from '@/lib/utils/logger'
import bcrypt from "bcryptjs";

const logger = new Logger('DatabaseSeed')

// Helper for consistent geo-locations (Simulating New Delhi area)
const BASE_LAT = 28.6139;
const BASE_LNG = 77.2090;

export async function seedDatabase() {
    try {
        logger.info('🌱 Starting comprehensive database seed...')

        // 1. CLEANUP (Order matters for Foreign Keys)
        logger.info('🧹 Cleaning existing data...')
        // Delete child tables first
        await prisma.review.deleteMany();
        await prisma.verification.deleteMany();
        await prisma.donation.deleteMany();
        await prisma.requestMatch.deleteMany();
        await prisma.bloodRequest.deleteMany();

        // Delete profile tables
        await prisma.recipientProfile.deleteMany();
        await prisma.donorProfile.deleteMany();

        // Delete users last
        await prisma.user.deleteMany();

        const hashedPassword = await bcrypt.hash('password123', 10);

        // ==========================================
        // 2. CREATE SPECIAL ACTORS (Verifier, Recipient, Ambassador)
        // ==========================================

        // A. The Recipient (Needs blood)
        const recipientUser = await prisma.user.create({
            data: {
                email: 'recipient@demo.com',
                passwordHash: hashedPassword,
                name: 'Alice Recipient',
                phone: '+919999999999',
                role: 'RECIPIENT',
                verificationStatus: 'VERIFIED_PEER',
            }
        });

        await prisma.recipientProfile.create({
            data: {
                userId: recipientUser.id,
                city: 'New Delhi',
                state: 'Delhi',
                // bloodType does not exist on RecipientProfile in schema, using preferredDonorTypes
                preferredDonorTypes: ['A_POSITIVE', 'O_POSITIVE'],
                latitude: BASE_LAT,
                longitude: BASE_LNG,
                medicalHistory: 'Chronic Anemia',
            }
        });
        logger.info('👤 Created Recipient: Alice');

        // B. The Verifier (Doctor/Hospital)
        const verifierUser = await prisma.user.create({
            data: {
                email: 'doctor@hospital.com',
                passwordHash: hashedPassword,
                name: 'Dr. Verifier',
                phone: '+918888888888',
                role: 'VERIFIER',
                verificationStatus: 'VERIFIED_BLOCKCHAIN', // Trusted
                walletAddress: '0x1234567890abcdef1234567890abcdef12345678', // Mock ETH address
            }
        });
        logger.info('👨‍⚕️ Created Verifier: Dr. Verifier');

        // C. The Ambassador (Community Leader)
        await prisma.user.create({
            data: {
                email: 'ambassador@community.com',
                passwordHash: hashedPassword,
                name: 'Rohit Ambassador',
                phone: '+917777777777',
                role: 'AMBASSADOR',
                verificationStatus: 'VERIFIED_BLOCKCHAIN',
                walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
                totalReputationScore: 2500,
            }
        });
        logger.info('🏅 Created Ambassador');

        // ==========================================
        // 3. CREATE DONORS (The Crowd)
        // ==========================================
        const donorsData = [
            {
                email: 'donor.o.pos@test.com',
                name: 'Rahul (O+)',
                role: 'DONOR',
                profile: {
                    bloodType: 'O_POSITIVE',
                    rhFactor: 'POSITIVE',
                    isAvailable: true, // Ready to donate
                    aiReputationScore: 0.95,
                    latitude: BASE_LAT + 0.01, // ~1km away
                    longitude: BASE_LNG + 0.01,
                }
            },
            {
                email: 'donor.a.neg@test.com',
                name: 'Priya (A-)',
                role: 'DONOR',
                profile: {
                    bloodType: 'A_NEGATIVE',
                    rhFactor: 'NEGATIVE',
                    isAvailable: true,
                    aiReputationScore: 0.88,
                    latitude: BASE_LAT - 0.02, // ~2km away
                    longitude: BASE_LNG - 0.01,
                }
            },
            {
                email: 'donor.b.pos@test.com',
                name: 'Vikram (B+)',
                role: 'DONOR',
                profile: {
                    bloodType: 'B_POSITIVE',
                    rhFactor: 'POSITIVE',
                    isAvailable: false, // Currently busy
                    aiReputationScore: 0.60,
                    latitude: BASE_LAT + 0.05,
                    longitude: BASE_LNG,
                }
            }
        ];

        // Explicitly type the array to avoid "never" type inference errors
        const createdDonors: { user: User; profile: DonorProfile }[] = [];

        for (const d of donorsData) {
            const user = await prisma.user.create({
                data: {
                    email: d.email,
                    passwordHash: hashedPassword,
                    name: d.name,
                    role: d.role as UserRole,
                    verificationStatus: 'VERIFIED_BLOCKCHAIN',
                }
            });

            const profile = await prisma.donorProfile.create({
                data: {
                    userId: user.id,
                    bloodType: d.profile.bloodType as BloodType,
                    rhFactor: d.profile.rhFactor,
                    isAvailable: d.profile.isAvailable,
                    aiReputationScore: d.profile.aiReputationScore,
                    latitude: d.profile.latitude,
                    longitude: d.profile.longitude,
                    totalSuccessfulDonations: Math.floor(Math.random() * 10),
                }
            });

            createdDonors.push({user, profile});
            logger.info(`🩸 Created Donor: ${d.name}`);
        }

        const verifierEligibleUser = await prisma.user.create({
            data: {
                email: 'eligible.verifier@test.com',
                passwordHash: hashedPassword,
                name: 'Suresh Eligible',
                phone: '+916666666666',
                role: 'DONOR',
                verificationStatus: 'VERIFIED_BLOCKCHAIN',
                totalReputationScore: 750, // ✅ Above 500 threshold
            }
        });

        await prisma.donorProfile.create({
            data: {
                userId: verifierEligibleUser.id,
                bloodType: 'O_POSITIVE',
                rhFactor: 'POSITIVE',
                isAvailable: true,
                aiReputationScore: 0.97,
                latitude: BASE_LAT + 0.015,
                longitude: BASE_LNG + 0.02,
                totalSuccessfulDonations: 3, // ✅ Minimum required
            }
        });

        logger.info('✅ Created Verifier-Eligible Donor Profile: Suresh');


        // ==========================================
        // 4. CREATE SCENARIOS (Requests & Matches)
        // ==========================================

        // Scenario 1: ACTIVE EMERGENCY (Unmatched)
        // ----------------------------------------
        await prisma.bloodRequest.create({
            data: {
                recipientId: recipientUser.id,
                bloodType: 'O_POSITIVE', // Matches Rahul
                rhFactor: 'POSITIVE',
                unitsNeeded: 2,
                urgencyLevel: 'EMERGENCY', // High priority (String literal)
                status: 'OPEN',
                latitude: BASE_LAT,
                longitude: BASE_LNG,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                // description: Removed (Not in schema)
            }
        });
        logger.info('🚨 Created Scenario 1: Active Emergency Request (O+)');

        // Scenario 2: MATCHED BUT PENDING (Awaiting Donation)
        // ----------------------------------------
        const matchedRequest = await prisma.bloodRequest.create({
            data: {
                recipientId: recipientUser.id,
                bloodType: 'A_NEGATIVE', // Matches Priya
                rhFactor: 'NEGATIVE',
                unitsNeeded: 1,
                urgencyLevel: 'HIGH',
                status: 'MATCHED',
                latitude: BASE_LAT,
                longitude: BASE_LNG,
                expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
            }
        });

        // Find Priya (A-)
        const priya = createdDonors.find(d => d.profile.bloodType === 'A_NEGATIVE');
        if (priya) {
            await prisma.requestMatch.create({
                data: {
                    requestId: matchedRequest.id,
                    donorId: priya.user.id,
                    status: 'ACCEPTED',
                    overallAIScore: 0.98, // Renamed from aiMatchScore
                    overallScore: 0.98,
                    distanceScore: 0.95, // Schema uses score, not raw distanceKm
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Added required field
                }
            });
        }
        logger.info('🤝 Created Scenario 2: Matched Request (A-)');

        // Scenario 3: COMPLETED HISTORY (Donation Done & Verified)
        // ----------------------------------------
        const completedRequest = await prisma.bloodRequest.create({
            data: {
                recipientId: recipientUser.id,
                bloodType: 'O_POSITIVE',
                rhFactor: 'POSITIVE',
                unitsNeeded: 1,
                urgencyLevel: 'MEDIUM',
                status: 'FULFILLED',
                latitude: BASE_LAT,
                longitude: BASE_LNG,
                expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Past
            }
        });

        // Use Rahul (O+) for this past donation
        const rahul = createdDonors.find(d => d.profile.bloodType === 'O_POSITIVE');
        if (rahul) {
            const match = await prisma.requestMatch.create({
                data: {
                    requestId: completedRequest.id,
                    donorId: rahul.user.id,
                    status: 'COMPLETED',
                    overallAIScore: 0.92,
                    distanceScore: 0.9,
                    expiresAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // Past
                }
            });

            // Create the Donation Record
            const donation = await prisma.donation.create({
                data: {
                    matchId: match.id,
                    donorId: rahul.user.id,
                    requestId: completedRequest.id,
                    status: 'COMPLETED',
                    unitsCollected: 1,
                    bloodType: 'O_POSITIVE',
                    rhFactor: 'POSITIVE',
                    completedAt: new Date(),
                    transactionHash: '0xabc...123', // Renamed from blockchainTxHash
                    blockchainVerified: true,
                }
            });

            // Create Verification by Dr. Verifier
            await prisma.verification.create({
                data: {
                    // Verification uses requestId relation, not donationId directly in schema provided,
                    // or maybe it does? Let's check schema.
                    // Schema says: requestId String?, request BloodRequest?
                    // It does NOT have donationId. It verifies the Request or User.
                    // If you want to link to donation, usually you verify the user action.
                    // For this seed, we link to the request.
                    requestId: completedRequest.id,
                    verifierId: verifierUser.id,
                    status: 'VERIFIED_BLOCKCHAIN', // Renamed from APPROVED
                    verificationType: 'DOCUMENT', // Renamed from verificationMethod
                    // notes: Removed (Not in schema)
                }
            });
        }
        logger.info('✅ Created Scenario 3: Completed & Verified Donation History');

        logger.info('🚀 Database seeding completed successfully!');

    } catch (error) {
        logger.error('Database seeding failed:', error as Error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run seed on startup if invoked directly
if (require.main === module) {
    seedDatabase().then(() => process.exit(0))
}