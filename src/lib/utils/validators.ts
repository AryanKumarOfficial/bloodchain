import {z} from 'zod'
// Assuming these types are defined in a central types file
import { UrgencyLevel, ValidationError} from '@/types'
import {$Enums} from "@prisma/client";
import UserRole = $Enums.UserRole;
import BloodType = $Enums.BloodType;

/**
 * ========================================
 * COMPREHENSIVE VALIDATION SCHEMAS
 * ========================================
 * Type-safe input validation for all endpoints
 */

// User Registration Schema
export const userRegistrationSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
    role: z.nativeEnum(UserRole),
})

// Blood Request Schema (Using the more complete version from file 1)
export const bloodRequestSchema = z.object({
    bloodType: z.nativeEnum(BloodType),
    rhFactor: z.enum(['POSITIVE', 'NEGATIVE']),
    units: z.number().min(1).max(10), // Renamed from 'unitsNeeded' for consistency
    urgency: z.nativeEnum(UrgencyLevel), // Renamed from 'urgencyLevel'
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radius: z.number().min(5).max(100).default(50), // Kept from file 1
    medicalProofIPFS: z.string().optional(), // Kept from file 1
})

// Donation Recording Schema
export const donationRecordSchema = z.object({
    matchId: z.string().cuid(),
    unitsCollected: z.number().min(1).max(10),
    ipfsProofHash: z.string(),
    verifierSignatures: z.array(z.string()),
})

// Verification Schema
export const verificationSchema = z.object({
    verificationType: z.enum(['BIOMETRIC', 'DOCUMENT', 'PROOF_OF_DONATION']),
    userId: z.string().cuid(),
    proofData: z.record(z.string(), z.any()),
})

// Donor Profile Schema (New from file 2)
export const donorProfileSchema = z.object({
    // Consider using z.nativeEnum(BloodType) for consistency
    bloodType: z.string().min(1),
    rhFactor: z.enum(['POSITIVE', 'NEGATIVE']),
    city: z.string().min(2),
    state: z.string().min(2),
})

// Matching Schema (New from file 2)
export const matchingSchema = z.object({
    requestId: z.string().cuid(),
})

/**
 * ========================================
 * TYPE INFERENCE
 * ========================================
 */

export type UserRegistration = z.infer<typeof userRegistrationSchema>
export type BloodRequestInput = z.infer<typeof bloodRequestSchema>
export type DonationRecord = z.infer<typeof donationRecordSchema>
export type VerificationInput = z.infer<typeof verificationSchema>
export type DonorProfileInput = z.infer<typeof donorProfileSchema>
export type MatchingInput = z.infer<typeof matchingSchema>

/**
 * ========================================
 * VALIDATION CLASS
 * ========================================
 */

export class Validator {
    // --- Schema-based Parsers ---

    static validateUserRegistration(data: any): UserRegistration {
        try {
            return userRegistrationSchema.parse(data)
        } catch (error: any) {
            throw new ValidationError(`Registration validation failed: ${error.message}`)
        }
    }

    static validateBloodRequest(data: any): BloodRequestInput {
        try {
            return bloodRequestSchema.parse(data)
        } catch (error: any) {
            throw new ValidationError(`Blood request validation failed: ${error.message}`)
        }
    }

    static validateDonationRecord(data: any): DonationRecord {
        try {
            return donationRecordSchema.parse(data)
        } catch (error: any) {
            throw new ValidationError(`Donation record validation failed: ${error.message}`)
        }
    }

    static validateDonorProfile(data: any): DonorProfileInput {
        try {
            return donorProfileSchema.parse(data)
        } catch (error: any) {
            throw new ValidationError(`Donor profile validation failed: ${error.message}`)
        }
    }

    static validateMatching(data: any): MatchingInput {
        try {
            return matchingSchema.parse(data)
        } catch (error: any) {
            throw new ValidationError(`Matching validation failed: ${error.message}`)
        }
    }

    // --- Standalone Regex/Utility Validators ---

    /**
     * Validates an email using Zod's robust email regex.
     */
    static validateEmail(email: string): boolean {
        return z.string().email().safeParse(email).success
    }

    /**
     * Validates an IPFS hash (v0 or v1).
     */
    static validateIPFSHash(hash: string): boolean {
        // CID v0 (Qm...) or v1 (ba...)
        return /^Qm[a-zA-Z0-9]{44}$/.test(hash) || /^ba[a-zA-Z0-9]{56}$/.test(hash)
    }

    /**
     * Validates an Ethereum-style wallet address.
     */
    static validateWalletAddress(address: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(address)
    }

    /**
     * Validates a phone number (E.164 format).
     */
    static validatePhoneNumber(phone: string): boolean {
        // Matches the regex in userRegistrationSchema
        return /^\+?[1-9]\d{1,14}$/.test(phone)
    }
}