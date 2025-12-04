// src/app/api/health/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // Simple query to check DB connection
        await prisma.$queryRaw`SELECT 1`

        return NextResponse.json(
            { status: 'healthy', timestamp: new Date().toISOString() },
            { status: 200 }
        )
    } catch (error) {
        console.error('Health check failed:', error)
        return NextResponse.json(
            { status: 'unhealthy', error: 'Database connection failed' },
            { status: 503 }
        )
    }
}