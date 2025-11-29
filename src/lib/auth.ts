import {NextAuthOptions} from 'next-auth'
import {PrismaAdapter} from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import {prisma} from '@/lib/prisma'
import {UserRole, VerificationStatus} from '@prisma/client'
import {validateUserCredentials} from '@/lib/services/auth.service'
import {Logger} from '@/lib/utils/logger'

/**
 * NEXTAUTH CONFIGURATION
 * Authentication setup with multiple providers
 */

const logger = new Logger('NextAuth')

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),

    providers: [
        // Google OAuth Provider
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            profile(profile) {
                // This object's fields MUST match your Prisma User model
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    role: UserRole.DONOR, // Use the Enum
                    verificationStatus: VerificationStatus.PENDING, // Use the Enum
                    blockedFromPlatform: false
                }
            },
        }),

        // Credentials Provider (Email/Password)
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: {label: 'Email', type: 'email', placeholder: 'user@example.com'},
                password: {label: 'Password', type: 'password'},
            },
            async authorize(credentials, req) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        logger.warn('Login attempt with missing credentials')
                        throw new Error('Missing email or password')
                    }

                    const user = await validateUserCredentials({
                        email: credentials.email,
                        password: credentials.password,
                    })

                    if (!user) {
                        logger.warn('Login attempt failed: Invalid credentials', {
                            email: credentials.email,
                        })
                        throw new Error('Invalid credentials')
                    }

                    if (user.blockedFromPlatform) {
                        logger.warn('Login attempt by blocked user', {userId: user.id})
                        throw new Error('This account has been suspended.')
                    }

                    logger.info('User authenticated successfully', {userId: user.id})

                    return user
                } catch (error) {
                    logger.error('Authentication error', error as Error)
                    throw new Error((error as Error).message || 'Authentication failed')
                }
            },
        }),
    ],

    // Callbacks are type-safe (assuming types/next-auth.d.ts exists)
    callbacks: {
        async jwt({token, user}) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.verificationStatus = user.verificationStatus
            }
            return token
        },

        async session({session, token}) {
            if (session.user) {
                session.user.id = token.id
                session.user.role = token.role
                session.user.verificationStatus = token.verificationStatus
            }
            return session
        },

        async signIn({user, account, profile, email, credentials}) {
            logger.info('User sign in', {
                userId: user.id,
                provider: account?.provider,
            })
            return true
        },

        async redirect({url, baseUrl}) {
            if (url.startsWith('/')) return `${baseUrl}${url}`
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl
        },
    },

    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },

    pages: {
        signIn: '/signin',
        signOut: '/signout',
        error: '/signin',
        verifyRequest: '/verify',
    },

    secret: process.env.NEXTAUTH_SECRET,
}

