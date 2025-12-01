import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Logger } from '@/lib/utils/logger'

const logger = new Logger('ActiveRequestsAPI')

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch requests that are OPEN and not yet expired
        const requests = await prisma.bloodRequest.findMany({
            where: {
                status: 'OPEN',
                expiresAt: {
                    gt: new Date() // Must expire in the future
                }
            },
            include: {
                recipient: {
                    select: {
                        name: true,
                        id: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50 // Limit to 50 for now
        })

        return NextResponse.json({
            success: true,
            data: {
                requests
            }
        }, { status: 200 })

    } catch (error) {
        logger.error('Failed to fetch active requests', error as Error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}