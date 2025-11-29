// types/prisma-extended.ts

import type {BloodRequest, Donation, DonorProfile, RecipientProfile, RequestMatch, User,} from '@prisma/client'

/**
 * Extended Prisma Types
 * Type-safe extensions for Prisma models
 */

export type UserWithProfile = User & {
    donorProfile?: DonorProfile | null
    recipientProfile?: RecipientProfile | null
}

export type BloodRequestWithMatches = BloodRequest & {
    matches: RequestMatch[]
    recipient: User
}

export type RequestMatchWithDetails = RequestMatch & {
    request: BloodRequest
    donor: UserWithProfile
}

export type DonationWithRelations = Donation & {
    match: RequestMatchWithDetails
    donor: User
    request: BloodRequest
}

export type DonorProfileWithUser = DonorProfile & {
    user: User
}

export type RecipientProfileWithUser = RecipientProfile & {
    user: User
}
