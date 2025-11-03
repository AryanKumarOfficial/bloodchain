import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { validateUserCredentials } from '@/lib/services/auth.service' // Import your new function
import { User } from '@/generated/prisma'

export const authOptions: NextAuthOptions = {
    // Use session strategy "jwt"
    session: {
        strategy: 'jwt',
    },

    // Add your custom login provider
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                // This is where you call your service!
                if (!credentials?.email || !credentials.password) {
                    return null
                }

                const user = await validateUserCredentials({
                    email: credentials.email,
                    password: credentials.password,
                })

                if (user) {
                    // Return the user object. NextAuth will handle the rest.
                    return user
                } else {
                    // Return null if user not found or password invalid
                    return null
                }
            },
        }),
        // ... you can add other providers here (e.g., Google, GitHub)
    ],

    // Callbacks to add your custom data (like ID and role) to the session
    callbacks: {
        // This is called *before* the session is created
        async jwt({ token, user }) {
            // On initial sign in, add your custom data to the token
            if (user) {
                token.id = user.id
                token.role = (user as User).role // Cast to get your custom 'role'
                token.verificationStatus = (user as User).verificationStatus
            }
            return token
        },

        // This is called to create the session object
        async session({ session, token }) {
            // Add the custom data from the token to the session object
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as any // Use 'any' or your UserRole enum
                session.user.verificationStatus = token.verificationStatus as any
            }
            return session
        },
    },

    pages: {
        signIn: '/login', // Tell NextAuth where your login page is
    },
}