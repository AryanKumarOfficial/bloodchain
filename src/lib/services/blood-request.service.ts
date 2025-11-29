import {prisma} from '@/lib/prisma'
import {Logger} from '@/lib/utils/logger'
import {GeoUtil, ICoordinates} from '@/lib/utils/distance'
import {
    HemoBridgeError,
    IBloodRequest,
    IBloodRequestCreateDto,
    UrgencyLevel,
    ValidationError,
    VerificationStatus,
} from '@/types'
import {Validator} from '@/lib/utils/validators'
import {$Enums, BloodRequest as PrismaBloodRequest, RequestMatch} from '@prisma/client'
import BloodType = $Enums.BloodType; // Import Prisma type
import RequestStatus = $Enums.RequestStatus;

/**
 * BLOOD REQUEST SERVICE
 * Manages blood requests, matching, and request lifecycle
 */

export class BloodRequestService {
    private logger: Logger = new Logger('BloodRequestService')

    /**
     * Create blood request
     */
    async createBloodRequest(
        userId: string,
        data: IBloodRequestCreateDto
    ): Promise<IBloodRequest> {
        try {
            this.logger.info('Creating blood request', {userId, bloodType: data.bloodType})

            // Validate input
            const validated = Validator.validateBloodRequest(data)

            // Check user is recipient
            const user = await prisma.user.findUnique({
                where: {id: userId},
            })

            if (!user) {
                throw new ValidationError('User not found')
            }

            // Create blood request
            const bloodRequest = await prisma.bloodRequest.create({
                data: {
                    recipientId: userId,
                    bloodType: validated.bloodType as BloodType,
                    rhFactor: validated.rhFactor as any,
                    unitsNeeded: validated.units,
                    urgencyLevel: validated.urgency as UrgencyLevel,
                    latitude: validated.latitude,
                    longitude: validated.longitude,
                    radius: validated.radius || 50,
                    medicalProofIPFSHash: validated.medicalProofIPFS,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    autoMatchingEnabled: true,
                    status: 'OPEN',
                    verificationStatus: VerificationStatus.PENDING,
                },
            })

            this.logger.info('Blood request created', {requestId: bloodRequest.id})
            return bloodRequest as IBloodRequest
        } catch (error) {
            this.logger.error('Failed to create blood request', error as Error)
            throw error
        }
    }

    /**
     * Find donors near request
     */
    async findNearbyDonors(
        requestId: string,
        maxResults: number = 10
    ): Promise<any[]> {
        try {
            const request = await prisma.bloodRequest.findUnique({
                where: {id: requestId},
            })

            if (!request) {
                throw new ValidationError('Blood request not found')
            }

            if (!request.latitude || !request.longitude) {
                throw new ValidationError('Location data missing')
            }

            const center: ICoordinates = {
                latitude: request.latitude,
                longitude: request.longitude,
            }

            // Get bounding box for database query
            const bbox = GeoUtil.getBoundingBox(center, request.radius)

            // NOTE: This function's distance filtering is incomplete as donors
            // do not have location data in your schema.
            // The AI service's location caching is the correct approach.

            // Find compatible donors
            const donors = await prisma.donorProfile.findMany({
                where: {
                    bloodType: request.bloodType,
                    isAvailable: true,
                    user: {
                        blockedFromPlatform: false,
                    },
                    // TODO: Add location query here using `bbox` if donors have lat/lon
                },
                include: {
                    user: true,
                },
                take: maxResults * 2,
            })

            // Filter by distance
            const nearbyDonors = donors
                .filter((donor) => {
                    if (!donor.user) return false

                    // TODO: This is placeholder logic. Donor location needs
                    // to be fetched from a live cache (like the AI service has).
                    const donorCoords: ICoordinates = {
                        latitude: 0,
                        longitude: 0,
                    }

                    return GeoUtil.isWithinRadius(center, donorCoords, request.radius)
                })
                .slice(0, maxResults)

            this.logger.info('Found nearby donors', {
                requestId,
                donorCount: nearbyDonors.length,
            })

            return nearbyDonors
        } catch (error) {
            this.logger.error('Failed to find nearby donors', error as Error)
            throw error
        }
    }

    /**
     * Confirms a donation match when a donor accepts.
     * Updates the match and the request status in a transaction.
     */
    async confirmDonationMatch(
        matchId: string,
        donorUserId: string
    ): Promise<RequestMatch & { request: PrismaBloodRequest }> {
        this.logger.info('Confirming donation match', {matchId, donorUserId});

        const updatedMatch = await prisma.$transaction(async (tx) => {
            // 1. Find the match and verify the donor
            const match = await tx.requestMatch.findUnique({
                where: {id: matchId},
                include: {donor: true}
            });

            if (!match) {
                throw new ValidationError('Match not found');
            }
            if (match.donorId !== donorUserId) {
                throw new HemoBridgeError("Unauthorized", 401, 'You are not the donor for this match');
            }
            if (match.status !== 'PENDING') {
                throw new ValidationError('This match has already been actioned');
            }

            // 2. Update the match status
            const confirmedMatch = await tx.requestMatch.update({
                where: {id: matchId},
                data: {
                    status: 'ACCEPTED',
                    respondedAt: new Date(),
                },
                include: {
                    // Include the request, which has the recipientId
                    // This is needed by the socket server
                    request: true,
                },
            });

            // 3. Update the blood request status to 'MATCHED'
            await tx.bloodRequest.update({
                where: {id: match.requestId},
                data: {status: 'MATCHED'},
            });

            return confirmedMatch;
        });

        this.logger.info('Match confirmed and request status updated', {
            matchId: updatedMatch.id,
            requestId: updatedMatch.requestId,
        });

        // The socket server needs this full object to notify the recipient
        return updatedMatch as RequestMatch & { request: PrismaBloodRequest };
    }


    /**
     * Update request status
     */
    async updateRequestStatus(
        requestId: string,
        status: string
    ): Promise<IBloodRequest> {
        try {
            const request = await prisma.bloodRequest.update({
                where: {id: requestId},
                data: {
                    status: status as RequestStatus
                },
            })

            this.logger.info('Blood request status updated', {
                requestId,
                status,
            })

            return request as IBloodRequest
        } catch (error) {
            this.logger.error('Failed to update request status', error as Error)
            throw error
        }
    }

    /**
     * Get request details
     */
    async getRequest(requestId: string): Promise<IBloodRequest | null> {
        try {
            const request = await prisma.bloodRequest.findUnique({
                where: {id: requestId},
                include: {
                    matches: true,
                    recipient: true,
                },
            })

            return request as IBloodRequest | null
        } catch (error) {
            this.logger.error('Failed to get request details', error as Error)
            throw error
        }
    }

    /**
     * Get active requests
     */
    async getActiveRequests(limit: number = 20): Promise<IBloodRequest[]> {
        try {
            const requests = await prisma.bloodRequest.findMany({
                where: {
                    status: 'OPEN',
                    expiresAt: {gt: new Date()},
                },
                orderBy: {urgencyLevel: 'desc'},
                take: limit,
            })

            return requests as IBloodRequest[]
        } catch (error) {
            this.logger.error('Failed to get active requests', error as Error)
            throw error
        }
    }
}

export const bloodRequestService = new BloodRequestService()
