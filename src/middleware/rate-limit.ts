// src/middleware/rate-limit.ts

import { NextRequest, NextResponse } from 'next/server'
import { Redis } from 'ioredis'

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
})

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100

export async function rateLimit(
    request: NextRequest,
    key: string
): Promise<boolean> {
    try {
        const count = await redis.incr(key)

        if (count === 1) {
            await redis.expire(key, Math.ceil(RATE_LIMIT_WINDOW / 1000))
        }

        return count <= RATE_LIMIT_MAX_REQUESTS
    } catch (error) {
        console.error('Rate limit check failed:', error)
        return true // Allow on error
    }
}

export function rateLimitMiddleware(maxRequests: number = RATE_LIMIT_MAX_REQUESTS) {
    return async (request: NextRequest) => {
        const ip =
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown'

        const key = `rate-limit:${ip}`
        const allowed = await rateLimit(request, key)

        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429 }
            )
        }

        return NextResponse.next()
    }
}
