import {BloodType, UserRole} from "@/generated/prisma"


export enum RhFactor {
    POSITIVE = 'POSITIVE',
    NEGATIVE = 'NEGATIVE',
}

export enum VerificationStatus {
    PENDING = 'PENDING',
    VERIFIED_PEER = 'VERIFIED_PEER',
    VERIFIED_BLOCKCHAIN = 'VERIFIED_BLOCKCHAIN',
    REJECTED = 'REJECTED',
    FLAGGED_FRAUD = 'FLAGGED_FRAUD',
}

export enum DonationStatus {
    PENDING = 'PENDING',
    IN_TRANSIT = 'IN_TRANSIT',
    COLLECTED = 'COLLECTED',
    TRANSFERRED = 'TRANSFERRED',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum UrgencyLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
    EMERGENCY = 'EMERGENCY',
}

export enum FraudSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

// ============= USER TYPES =============


export interface IUser {
    id: string
    email: string
    passwordHash?: string
    name?: string
    phone?: string
    role: UserRole
    did?: string
    publicKey?: string
    privateKeyEncrypted?: string
    walletAddress?: string
    reputationNFTId?: string
    totalReputationScore: number
    blockedFromPlatform: boolean
    verificationStatus: VerificationStatus
    createdAt: Date
    updatedAt: Date
    lastActiveAt?: Date
}

export interface IDonorProfile {
    id: string
    userId: string
    bloodType: BloodType
    rhFactor: RhFactor
    isAvailable: boolean
    lastDonationDate?: Date
    nextEligibleDate?: Date
    aiReputationScore: number
    totalSuccessfulDonations: number
    totalFailedMatches: number
    avgResponseTime?: number
    nftBadgesIssued: string[]
    totalRewardsEarned: number
    rewardNFTsMinted: number
    biometricVerified: boolean
    biometricHash?: string
    lastBiometricVerified?: Date
    fraudRiskScore: number
    createdAt: Date
}

export interface IRecipientProfile {
    id: string
    userId: string
    medicalHistory?: string
    emergencyContacts?: string
    preferredDonorTypes: BloodType[]
    createdAt: Date
}

// ============= BLOOD REQUEST TYPES =============

export interface IBloodRequest {
    id: string
    recipientId: string
    bloodType: BloodType
    rhFactor: RhFactor
    unitsNeeded: number
    urgencyLevel: UrgencyLevel
    latitude?: number
    longitude?: number
    radius: number
    medicalProofIPFSHash?: string
    verificationStatus: VerificationStatus
    verifiedByPeers: string[]
    requiredVerifications: number
    smartContractAddress?: string
    transactionHash?: string
    isOnChain: boolean
    status: 'OPEN' | 'MATCHED' | 'FULFILLED' | 'EXPIRED'
    expiresAt: Date
    autoMatchingEnabled: boolean
    createdAt: Date
    updatedAt: Date
}

export interface IRequestMatch {
    id: string
    requestId: string
    donorId: string
    compatibilityScore: number
    distanceScore: number
    reputationScore: number
    urgencyScore: number
    overallAIScore: number
    escrowContractAddress?: string
    escrowAmount?: number
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'EXPIRED'
    automatchedAt?: Date
    respondedAt?: Date
    expiresAt: Date
    createdAt: Date
}

export interface IDonation {
    id: string
    matchId: string
    donorId: string
    requestId: string
    bloodType: BloodType
    rhFactor: RhFactor
    unitsCollected: number
    transactionHash?: string
    smartContractHash?: string
    blockchainVerified: boolean
    status: DonationStatus
    completionProofIPFS?: string
    rewardTokensIssued: number
    nftMinted: boolean
    nftTokenId?: string
    createdAt: Date
    updatedAt: Date
    completedAt?: Date
}

// ============= VERIFICATION TYPES =============

export interface IVerificationAttempt {
    id: string
    userId: string
    verificationType: 'BIOMETRIC' | 'DOCUMENT' | 'PROOF_OF_DONATION'
    status: VerificationStatus
    facialEmbeddingHash?: string
    livenessScore?: number
    spoofDetectionScore?: number
    fraudRiskScore: number
    fraudFlags: string[]
    attestationHash?: string
    attestedByVerifiers: string[]
    trustScore: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    createdAt: Date
}

export interface IVerification {
    id: string
    verificationType: 'BIOMETRIC' | 'DOCUMENT' | 'PEER_REVIEW'
    requestId?: string
    verifierId: string
    blockchainSignature?: string
    merkleProof?: string
    status: VerificationStatus
    confidence: number
    createdAt: Date
}

// ============= BLOCKCHAIN TYPES =============

export interface IDonationRecord {
    recordId: string
    donor: string
    recipient: string
    bloodType: string
    unitsCollected: number
    timestamp: number
    verified: boolean
    verifiers: string[]
    rewardIssued: number
    nftMinted: boolean
}

export interface ISmartContractEvent {
    id: string
    eventName: string
    transactionHash: string
    blockNumber: number
    contractAddress: string
    eventData: Record<string, any>
    createdAt: Date
}

// ============= AI/ML TYPES =============

export interface IAIFeatureVector {
    bloodTypeCompatibility: number
    rhFactorCompatibility: number
    donorReputationScore: number
    donorAvailability: number
    successRate: number
    responseTimeNormalized: number
    daysSinceLastDonation: number
    urgencyLevel: number
    fraudRiskInverse: number
    biometricVerification: number
}

export interface IAIMatchingScore {
    donorId: string
    userId: string
    distance: number
    aiScore: number
    reputation: number
    compatibilityScore: number
    distanceScore: number
    reputationScore: number
    availabilityScore: number
    responseScore: number
    overallScore: number
}

export interface IModelTrainingConfig {
    epochs: number
    batchSize: number
    learningRate: number
    validationSplit: number
    trainingSamples: number
    testSamples: number
}


export interface ITrainingHistory {
    [metric: string]: number[]
}

export interface IModelEvaluation {
    loss: number
    accuracy: number
    precision: number
    recall: number
    f1Score: number //
    confusionMatrix: number[][]
}

// ============= FRAUD DETECTION TYPES =============

export interface IFraudAlert {
    id: string
    userId: string
    alertType: string
    severity: FraudSeverity
    description: string
    fraudScore: number
    blockchainAttested: boolean
    createdAt: Date
    resolvedAt?: Date
}

export interface IFraudScore {
    score: number
    risk: 'low' | 'medium' | 'high' | 'critical'
    factors: {
        behavioral: number
        device: number
        velocity: number
    }
}

// ============= API RESPONSE TYPES =============

export interface IApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
    statusCode: number
    timestamp: Date
}

export interface IBloodRequestCreateDto {
    bloodType: BloodType
    rhFactor: RhFactor
    units: number
    urgency: UrgencyLevel
    latitude: number
    longitude: number
    radius?: number
    medicalProofIPFS?: string
}

export interface IBloodRequestResponse {
    requestId: string
    automatchedDonors: number
    message: string
}

export interface IDonationRecordDto {
    matchId: string
    unitsCollected: number
    ipfsProofHash: string
    verifierSignatures: string[]
}


// ============= BLOCKCHAIN TYPES =============

export interface IBlockchainConfig {
    rpcUrl: string
    privateKey: string
    contractAddress: string
    tokenAddress: string
    chainId: number
    gasLimit: number
}

export interface ISmartContractCall {
    functionName: string
    parameters: any[]
    gasLimit?: number
    value?: string
}

// ============= AUTHENTICATION TYPES =============

export interface IAuthCredentials {
    email: string
    password: string
}

export interface IAuthResponse {
    token: string
    user: Partial<IUser>
    expiresIn: number
}

export interface ISession {
    user: {
        id: string
        email: string
        name?: string
        role: UserRole
    }
    expires: Date
}

// ============= SOCKET.IO TYPES =============

export interface ISocketEvent {
    eventName: string
    data: Record<string, any>
    timestamp: Date
}

export interface ILocationUpdate {
    latitude: number
    longitude: number
    accuracy: number
    speed?: number
    heading?: number
    timestamp: number
}

export interface IEmergencyBroadcast {
    type: 'NEW_REQUEST' | 'URGENT_MATCH' | 'COMPLETION'
    urgency: UrgencyLevel
    bloodType: BloodType
    units: number
    radius: number
    timestamp: Date
}

// ============= VERIFIER POOL TYPES =============

export interface IDecentralizedVerifierPool {
    id: string
    verifierUserId: string
    qualificationScore: number
    successfulVerifications: number
    disputedVerifications: number
    verifierCredential?: string
    smartContractAddress?: string
    isActive: boolean
    createdAt: Date
}

// ============= ERROR TYPES =============

export class HemoBridgeError extends Error {
    constructor(
        public code: string,
        public statusCode: number,
        message: string
    ) {
        super(message)
        this.name = 'HemoBridgeError'
    }
}

export class ValidationError extends HemoBridgeError {
    constructor(message: string) {
        super('VALIDATION_ERROR', 400, message)
        this.name = 'ValidationError'
    }
}

export class AuthenticationError extends HemoBridgeError {
    constructor(message: string = 'Unauthorized') {
        super('AUTHENTICATION_ERROR', 401, message)
        this.name = 'AuthenticationError'
    }
}

export class BlockchainError extends HemoBridgeError {
    constructor(message: string) {
        super('BLOCKCHAIN_ERROR', 500, message)
        this.name = 'BlockchainError'
    }
}

export class FraudDetectedError extends HemoBridgeError {
    constructor(message: string = 'Fraud detected') {
        super('FRAUD_DETECTED', 403, message)
        this.name = 'FraudDetectedError'
    }
}