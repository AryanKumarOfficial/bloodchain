// app/api/requests/broadcast-urgent/route.ts

import {NextRequest, NextResponse} from 'next/server'
import {getServerSession} from 'next-auth'
import {authOptions} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {notificationService} from '@/lib/services/notification.service'
import {Logger} from '@/lib/utils/logger'

const logger = new Logger('UrgentBroadcastAPI')

/**
 * POST /api/requests/broadcast-urgent
 * Broadcast urgent blood request to nearby donors
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

        const bloodRequest = await prisma.bloodRequest.findUnique({
            where: {id: requestId},
        })

        if (!bloodRequest) {
            return NextResponse.json(
                {error: 'Request not found'},
                {status: 404}
            )
        }

        if (!bloodRequest.latitude || !bloodRequest.longitude) {
            return NextResponse.json(
                {error: 'Location data missing'},
                {status: 400}
            )
        }

        logger.info('📢 Broadcasting urgent request', {
            requestId,
            urgency: bloodRequest.urgencyLevel,
        })

        // Broadcast to nearby donors
        await notificationService.broadcastUrgentRequest(
            requestId,
            bloodRequest.latitude,
            bloodRequest.longitude,
            bloodRequest.urgencyLevel
        )

        logger.info('✅ Urgent broadcast completed', {requestId})

        return NextResponse.json(
            {success: true, message: 'Broadcast sent successfully'},
            {status: 200}
        )
    } catch (error) {
        logger.error('Broadcast error: ' + (error as Error).message)
        return NextResponse.json(
            {error: 'Broadcast failed'},
            {status: 500}
        )
    }
}
