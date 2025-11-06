// app/api/verify/biometric/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { biometricService } from '@/lib/services/biometric.service'
import { Logger } from '@/lib/utils/logger'

const logger = new Logger('BiometricVerificationAPI')

/**
 * POST /api/verify/biometric
 * Verify user identity using face recognition
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const formData = await request.formData()
        const imageFile = formData.get('image') as File

        if (!imageFile) {
            return NextResponse.json(
                { error: 'Image required' },
                { status: 400 }
            )
        }

        logger.info('📸 Processing biometric verification', {
            userId: session.user.id,
        })

        // Convert image to buffer
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

        // Process face image
        const faceData = await biometricService.processFaceImage(imageBuffer)

        // Get user's donor profile
        const donorProfile = await prisma.donorProfile.findUnique({
            where: { userId: session.user.id },
        })

        if (!donorProfile) {
            return NextResponse.json(
                { error: 'Donor profile not found' },
                { status: 404 }
            )
        }

        let verificationResult

        // If first verification, store embedding
        if (!donorProfile.biometricHash) {
            const embeddingHash = biometricService.hashEmbedding(faceData.embedding)

            await prisma.donorProfile.update({
                where: { id: donorProfile.id },
                data: {
                    biometricVerified: true,
                    biometricHash: embeddingHash,
                    lastBiometricVerified: new Date(),
                },
            })

            verificationResult = {
                verified: true,
                message: 'Biometric data recorded successfully',
                confidence: faceData.livenessScore,
            }

            logger.info('✅ Biometric recorded', { userId: session.user.id })
        } else {
            // Verify against stored embedding
            // In production, retrieve actual stored embedding
            const storedEmbedding = faceData.embedding // Mock - should be from DB

            verificationResult = await biometricService.verifyFace(
                faceData,
                storedEmbedding
            )

            if (verificationResult.verified) {
                await prisma.donorProfile.update({
                    where: { id: donorProfile.id },
                    data: {
                        biometricVerified: true,
                        lastBiometricVerified: new Date(),
                    },
                })

                logger.info('✅ Biometric verification passed', {
                    userId: session.user.id,
                })
            } else {
                logger.warn('❌ Biometric verification failed', {
                    userId: session.user.id,
                    reason: verificationResult.spoofRisk,
                })
            }
        }

        return NextResponse.json(verificationResult, { status: 200 })
    } catch (error) {
        logger.error('Biometric verification error: ' + (error as Error).message)
        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        )
    }
}
