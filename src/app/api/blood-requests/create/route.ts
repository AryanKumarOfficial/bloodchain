// app/api/blood-requests/create/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { bloodRequestService } from '@/lib/services/blood-request.service'
import { aiService } from '@/lib/services/ai.service'
import { Logger } from '@/lib/utils/logger'
import {
    IApiResponse,
    IBloodRequestCreateDto,
    ValidationError,
    AuthenticationError,
} from '@/types'

const logger = new Logger('BloodRequestAPI')

export async function POST(
    request: NextRequest
): Promise<NextResponse<IApiResponse<any>>> {
    try {
        logger.info('POST /api/blood-requests/create')

        // Check authentication
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            throw new AuthenticationError('Unauthorized')
        }

        // Parse request body
        const body: IBloodRequestCreateDto = await request.json()

        // Create a blood request
        const bloodRequest = await bloodRequestService.createBloodRequest(
            session.user.id,
            body
        )

        // Initialize AI model
        await aiService.initializeModel()

        // Run autonomous matching
        const matches = await aiService.autonomousMatching(bloodRequest.id)

        logger.info('Blood request created with autonomous matching', {
            requestId: bloodRequest.id,
            matchCount: matches.length,
        })

        return NextResponse.json(
            {
                success: true,
                data: {
                    requestId: bloodRequest.id,
                    automatchedDonors: matches.length,
                    matches: matches.slice(0, 3),
                },
                message: `Blood request created. ${matches.length} donors auto-matched.`,
                statusCode: 201,
                timestamp: new Date(),
            },
            { status: 201 }
        )
    } catch (error) {
        logger.error('Failed to create blood request', error as Error)

        if (error instanceof ValidationError) {
            return NextResponse.json(
                {
                    success: false,
                    error: error.message,
                    statusCode: error.statusCode,
                    timestamp: new Date(),
                },
                { status: error.statusCode }
            )
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                statusCode: 500,
                timestamp: new Date(),
            },
            { status: 500 }
        )
    }
}
