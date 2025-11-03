// lib/utils/validators.ts

import {z} from 'zod'
import {BloodType, UrgencyLevel, UserRole, ValidationError} from '@/types'

/**
 * COMPREHENSIVE VALIDATION SCHEMAS
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

// Blood Request Schema
export const bloodRequestSchema = z.object({
    bloodType: z.nativeEnum(BloodType),
    rhFactor: z.enum(['POSITIVE', 'NEGATIVE']),
    units: z.number().min(1).max(10),
    urgency: z.nativeEnum(UrgencyLevel),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radius: z.number().min(5).max(100).default(50),
    medicalProofIPFS: z.string().optional(),
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

// Type inference
export type UserRegistration = z.infer<typeof userRegistrationSchema>
export type BloodRequestInput = z.infer<typeof bloodRequestSchema>
export type DonationRecord = z.infer<typeof donationRecordSchema>
export type VerificationInput = z.infer<typeof verificationSchema>

/**
 * VALIDATION FUNCTIONS
 */

export class Validator {
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

    static validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    static validateIPFSHash(hash: string): boolean {
        return /^Qm[a-zA-Z0-9]{44}$/.test(hash) || /^ba[a-zA-Z0-9]{56}$/.test(hash)
    }

    static validateWalletAddress(address: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(address)
    }

    static validatePhoneNumber(phone: string): boolean {
        return /^\+?[1-9]\d{1,14}$/.test(phone)
    }
}
