import {Server as HTTPServer} from 'http'
import {Server as IOServer, Socket} from 'socket.io'
import {createAdapter} from '@socket.io/redis-adapter' // Ensure this package is installed
import {createClient} from 'redis'
import {Logger} from '@/lib/utils/logger'
import {bloodRequestService} from '@/lib/services/blood-request.service'
import {aiService} from '@/lib/services/ai.service'
import {IEmergencyBroadcast, ILocationUpdate, UrgencyLevel,} from '@/types'

/**
 * SOCKET.IO SERVER
 * Real-time communication and autonomous updates
 */

const logger = new Logger('SocketServer')

declare module 'socket.io' {
    interface Socket {
        userId?: string
        userToken?: string
    }
}

export class SocketIOServer {
    private io: IOServer
    private connectedDonors: Map<string, string> = new Map() // userId -> socketId
    private connectedRecipients: Map<string, string> = new Map()

    constructor(httpServer: HTTPServer) {
        this.io = new IOServer(httpServer, {
            cors: {
                origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true,
            },
            maxHttpBufferSize: 1e6,
        })

        // PATCH: Initialize Redis Adapter for Production Scaling
        this.initializeAdapter();

        this.setupMiddleware()
        this.setupConnections()
    }

    private async initializeAdapter() {
        if (process.env.REDIS_URL) {
            try {
                const pubClient = createClient({url: process.env.REDIS_URL});
                const subClient = pubClient.duplicate();

                await Promise.all([pubClient.connect(), subClient.connect()]);

                this.io.adapter(createAdapter(pubClient, subClient));
                logger.info('✅ Socket.io Redis Adapter initialized');
            } catch (error) {
                logger.error('Failed to initialize Redis Adapter', error as Error);
            }
        }
    }

    /**
     * Setup Socket.IO middleware
     */
    private setupMiddleware(): void {
        this.io.use((socket, next) => {
            const userId = socket.handshake.auth.userId
            const token = socket.handshake.auth.token

            if (!userId || !token) {
                logger.warn('Socket connection attempt without auth')
                return next(new Error('Authentication required'))
            }

            // Augment the socket object
            socket.userId = userId
            socket.userToken = token
            next()
        })
    }

    /**
     * Setup connection handlers
     */
    private setupConnections(): void {
        this.io.on('connection', (socket: Socket) => {
            if (!socket.userId) {
                logger.error(`Socket connected without userId after middleware. socketId: ${socket.id}`)
                socket.disconnect(true)
                return
            }
            logger.info('Socket connected', {socketId: socket.id, userId: socket.userId})

            // Register donor
            socket.on('register-donor', (data: { userId: string }) => {
                this.connectedDonors.set(data.userId, socket.id)
                socket.join(`donor-${data.userId}`)
                socket.join('donors')
                logger.info('Donor registered', {userId: data.userId})
            })

            // Register recipient
            socket.on('register-recipient', (data: { userId: string }) => {
                this.connectedRecipients.set(data.userId, socket.id)
                socket.join(`recipient-${data.userId}`)
                socket.join('recipients')
                logger.info('Recipient registered', {userId: data.userId})
            })

            // Location tracking
            socket.on('location-update', async (data: ILocationUpdate) => {
                if (!socket.userId) return;

                logger.debug('Location update received', {
                    userId: socket.userId,
                    lat: data.latitude.toFixed(4),
                    lon: data.longitude.toFixed(4),
                })

                try {
                    await aiService.updateDonorLocation(socket.userId, data.latitude, data.longitude);
                } catch (error) {
                    logger.error('Failed to update donor location via AI service', error as Error);
                }
            })

            // Blood request creation
            socket.on('new-blood-request', async (data: any) => {
                try {
                    logger.info('New blood request event', {userId: socket.userId})

                    this.broadcastEmergencyAlert({
                        type: 'NEW_REQUEST',
                        urgency: data.urgency as UrgencyLevel,
                        bloodType: data.bloodType,
                        units: data.units,
                        radius: data.radius || 50,
                        timestamp: new Date(),
                    })

                    this.io.to('donors').emit('emergency-request-broadcast', {
                        requestId: data.requestId,
                        bloodType: data.bloodType,
                        urgency: data.urgency,
                        units: data.units,
                        radius: data.radius,
                        timestamp: new Date(),
                    })
                } catch (error) {
                    logger.error('Blood request event error', error as Error)
                    socket.emit('error', {message: 'Failed to process request'})
                }
            })

            // Donor matching notification
            socket.on('donor-matched', async (data: any) => {
                try {
                    logger.info('Donor matched event', {matchId: data.matchId})

                    this.io
                        .to(`donor-${data.donorId}`)
                        .emit('auto-matched-notification', {
                            matchId: data.matchId,
                            requestId: data.requestId,
                            aiScore: data.aiScore,
                            message: 'You have been auto-matched with a blood request!',
                            expiresIn: 60,
                            timestamp: new Date(),
                        })

                    this.io
                        .to(`recipient-${data.recipientId}`)
                        .emit('donor-matched-notification', {
                            matchId: data.matchId,
                            donorCount: data.donorCount,
                            message: `${data.donorCount} donor(s) matched!`,
                            timestamp: new Date(),
                        })
                } catch (error) {
                    logger.error('Donor matching event error', error as Error)
                }
            })

            // Donation completion
            socket.on('donation-completed', async (data: any) => {
                try {
                    logger.info('Donation completed event', {
                        donationId: data.donationId,
                    })
                    this.io.to(`recipient-${data.recipientId}`).emit('donation-complete-status', {
                        donationId: data.donationId,
                        message: 'Your request is complete!'
                    });
                    this.io.to(`donor-${data.donorId}`).emit('donation-complete-status', {
                        donationId: data.donationId,
                        reward: data.rewardAmount,
                        message: 'Donation confirmed! Reward issued.'
                    });
                } catch (error) {
                    logger.error('Donation completion event error', error as Error)
                }
            })

            // Accept donation request
            socket.on('accept-donation', async (data: any) => {
                if (!socket.userId) return;
                try {
                    logger.info('Donation accepted', {matchId: data.matchId, userId: socket.userId})

                    const match = await bloodRequestService.confirmDonationMatch(data.matchId, socket.userId);

                    socket.emit('donation-accepted-confirmed', {
                        matchId: data.matchId,
                        message: 'Donation request accepted. Recipient notified.',
                        timestamp: new Date(),
                    })

                    if (match && match.request) {
                        this.io
                            .to(`recipient-${match.request.recipientId}`)
                            .emit('match-confirmed-by-donor', {
                                matchId: data.matchId,
                                donorId: socket.userId,
                                message: 'A donor has accepted your request!'
                            });
                    }
                } catch (error) {
                    logger.error('Accept donation error', error as Error)
                    socket.emit('error', {message: 'Failed to accept donation'})
                }
            })

            socket.on('disconnect', () => {
                logger.info('Socket disconnected', {socketId: socket.id})
            })

            socket.on('error', (error: Error) => {
                logger.error('Socket error', error)
            })
        })
    }

    private broadcastEmergencyAlert(alert: IEmergencyBroadcast): void {
        this.io.emit('emergency-alert', alert)
    }

    sendToUser(userId: string, event: string, data: any): void {
        const socketId = this.connectedDonors.get(userId) ||
            this.connectedRecipients.get(userId)

        if (socketId) {
            this.io.to(socketId).emit(event, data)
        }
    }

    broadcastToDonors(event: string, data: any): void {
        this.io.to('donors').emit(event, data)
    }

    broadcastToRecipients(event: string, data: any): void {
        this.io.to('recipients').emit(event, data)
    }

    getConnectedStats(): Record<string, number> {
        return {
            totalConnections: this.io.engine.clientsCount,
            connectedDonors: this.connectedDonors.size,
            connectedRecipients: this.connectedRecipients.size,
        }
    }
}