// types/next-auth.d.ts
import {DefaultSession, DefaultUser} from "next-auth"
import {UserRole, VerificationStatus} from "@prisma/client"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: UserRole
            verificationStatus: VerificationStatus
            blockedFromPlatform: boolean
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        id: string
        role: UserRole
        verificationStatus: VerificationStatus
        blockedFromPlatform: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: UserRole
        verificationStatus: VerificationStatus
        blockedFromPlatform: boolean
    }
}