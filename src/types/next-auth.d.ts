// This file tells TypeScript what your custom Session and JWT look like

import 'next-auth'
import 'next-auth/jwt'
import { UserRole, VerificationStatus } from '@/generated/prisma'

/**
 * Augment the 'next-auth' module
 */
declare module 'next-auth' {
    /**
     * The shape of the user object returned by the `authorize` callback
     */
    interface User {
        id: string
        role: UserRole
        verificationStatus: VerificationStatus
        // Add any other properties from your Prisma User model you want to use
    }

    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` client-side.
     * This is what you'll see in your API routes (e.g., `session.user.id`).
     */
    interface Session {
        user: {
            /** The user's database ID */
            id: string
            /** The user's role */
            role: UserRole
            /** The user's verification status */
            verificationStatus: VerificationStatus
        } & {
            // ...and the default properties
            name?: string | null
            email?: string | null
            image?: string | null
        }
    }
}

/**
 * Augment the 'next-auth/jwt' module
 */
declare module 'next-auth/jwt' {
    /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
    interface JWT {
        /** User's database ID */
        id: string
        /** User's role */
        role: UserRole
        /** User's verification status */
        verificationStatus: VerificationStatus
    }
}
