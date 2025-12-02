import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Logger } from '@/lib/utils/logger' // Assuming logger is in utils
import { userRegistrationSchema } from '@/lib/utils/validators' // Assuming validators is in utils
import bcrypt from 'bcryptjs' // Use bcryptjs as seen in package.json
import { z } from 'zod'
import type { Notification } from "@/lib/services/notification.service"
import { notificationService } from '@/lib/services/notification.service'

const logger = new Logger('AuthRegisterAPI')

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body: unknown = await request.json()
        const validated = userRegistrationSchema.parse(body)

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validated.email },
        })

        if (existingUser) {
            return NextResponse.json(
                {
                    error: 'Email already registered',
                    success: false

                },
                { status: 409 }
            )
        }

        // Hash password
        const passwordHash = await bcrypt.hash(validated.password, 10)

        // Create user
        const user = await prisma.user.create({
            data: {
                email: validated.email,
                passwordHash,
                name: validated.name,
                phone: validated.phone,
                role: validated.role,
                verificationStatus: 'PENDING',
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        })

        logger.info('✅ User registered', { userId: user.id, email: user.email })

        // TODO: Send verification email (using notificationService)
        const notification: Notification = {
            type: "USER_REGISTRATION",
            userId: user.id,
            title: "Registration Successfull",
            message: `Your Account is created Successfully`

        }
        await notificationService.sendEmailNotification(user.email, notification)
        return NextResponse.json(
            {
                success: true,
                userId: user.id,
                message: 'Registration successful. Please login!',
            },
            { status: 201 }
        )
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.cause, success: false },
                { status: 400 }
            )
        }
        logger.error('Registration error:', error as Error)
        return NextResponse.json(
            { error: 'Registration failed', success: false },
            { status: 500 }
        )
    }
}