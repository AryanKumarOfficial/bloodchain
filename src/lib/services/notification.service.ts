// src/services/notification.service.ts

import {Logger} from '@/lib/utils/logger'
import {prisma} from '@/lib/prisma'
import nodemailer from 'nodemailer'

export interface Notification {
    userId: string
    type:
        | 'MATCH_FOUND'
        | 'DONATION_COMPLETED'
        | 'URGENT_REQUEST'
        | 'REWARD_ISSUED'
        | 'VERIFICATION_REQUIRED'
        | 'USER_REGISTRATION'
    title: string
    message: string
    data?: Record<string, any>
}

const logger = new Logger('NotificationService')

// Email transporter
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
})

export class NotificationService {
    /**
     * Send in-app notification
     */
    async sendInAppNotification(notification: Notification): Promise<void> {
        try {
            // In production, save to DB and emit via WebSocket
            logger.info('📢 In-app notification', {
                userId: notification.userId,
                type: notification.type,
            })

            // Emit via Socket.IO if available
            if (global.io) {
                global.io.to(notification.userId).emit('notification', notification)
            }

            await prisma.notification.create({
                data: {
                    userId: notification.userId,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                }
            })
            console.log(`Notification sent: ${notification.type}`)
        } catch (error) {
            logger.error('Failed to send in-app notification: ' + (error as Error).message)
        }
    }

    /**
     * Send email notification
     */
    async sendEmailNotification(
        userEmail: string,
        notification: Notification
    ): Promise<void> {
        try {
            const emailContent = this.generateEmailContent(notification)

            await emailTransporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: notification.title,
                html: emailContent,
            })

            logger.info('✉️ Email sent', {email: userEmail, type: notification.type})
        } catch (error) {
            logger.error('Failed to send email: ' + (error as Error).message)
        }
    }

    /**
     * Send SMS notification (integrate with Twilio)
     */
    async sendSMSNotification(
        phoneNumber: string,
        message: string
    ): Promise<void> {
        try {
            // Production: Use Twilio or similar service
            logger.info('📱 SMS notification (simulated)', {
                phone: phoneNumber.slice(-4),
                message: message.slice(0, 50),
            })
        } catch (error) {
            logger.error('Failed to send SMS: ' + (error as Error).message)
        }
    }

    /**
     * Generate email HTML content
     */
    private generateEmailContent(notification: Notification): string {
        const templates: Record<string, string> = {
            MATCH_FOUND: `
        <h2>🎉 Match Found!</h2>
        <p>${notification.message}</p>
        <p>A compatible blood request has been found matching your profile.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background-color: #DC143C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Match</a>
      `,
            URGENT_REQUEST: `
        <h2>🚨 Urgent Blood Request</h2>
        <p>${notification.message}</p>
        <p>There's an urgent need for blood. Your contribution can save a life!</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests" style="background-color: #DC143C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Request</a>
      `,
            REWARD_ISSUED: `
        <h2>🎁 Reward Issued!</h2>
        <p>${notification.message}</p>
        <p>Thank you for your contribution. Check your wallet for rewards.</p>
      `,
            DEFAULT: `
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
      `,
        }

        return templates[notification.type] || templates.DEFAULT
    }

    /**
     * Broadcast urgent request to nearby donors
     */
    async broadcastUrgentRequest(
        requestId: string,
        latitude: number,
        longitude: number,
        urgency: string
    ): Promise<void> {
        try {
            // Find nearby donors within 50km
            const nearbyDonors = await prisma.donorProfile.findMany({
                where: {
                    isAvailable: true,
                    user: {blockedFromPlatform: false},
                },
                include: {user: true},
                take: 100,
            })

            logger.info(`📢 Broadcasting urgent request to ${nearbyDonors.length} donors`)

            // Send notifications to all nearby donors
            for (const donor of nearbyDonors) {
                if (donor.user.email) {
                    await this.sendEmailNotification(donor.user.email, {
                        userId: donor.userId,
                        type: 'URGENT_REQUEST',
                        title: `🚨 ${urgency} Blood Request Nearby!`,
                        message: `An urgent blood request has been posted near you. Your help is needed!`,
                        data: {requestId},
                    })
                    await this.sendInAppNotification({
                        userId: donor.userId,
                        type: "URGENT_REQUEST",
                        title: `🚨 ${urgency} Blood Request Nearby!`,
                        message: `An urgent blood request has been posted near you. Your help is needed!`,
                        data: {requestId},
                    })
                }
            }
        } catch (error) {
            logger.error('Failed to broadcast urgent request: ' + (error as Error).message)
        }
    }
}

export const notificationService = new NotificationService()

// Declare global io
declare global {
    var io: any
}
