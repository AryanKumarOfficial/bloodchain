import bcrypt from 'bcryptjs'
import {prisma} from '@/lib/prisma'
import {Logger} from '@/lib/utils/logger'
import {IAuthCredentials} from '@/types'
import {User} from '@/generated/prisma' // Import the full User type

const logger = new Logger('AuthValidator')

/**
 * Validates user credentials and returns the user object if successful.
 * NextAuth will call this.
 */
export async function validateUserCredentials(
    credentials: IAuthCredentials
): Promise<Omit<User, 'passwordHash'> | null> {
    try {
        const user = await prisma.user.findUnique({
            where: {email: credentials.email},
        })

        // No user found
        if (!user || !user.passwordHash) {
            logger.warn('Login failed: User not found', {email: credentials.email})
            return null
        }

        // Check password
        const passwordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
        )

        if (!passwordValid) {
            logger.warn('Login failed: Invalid password', {email: credentials.email})
            return null
        }

        logger.info('User validated successfully', {userId: user.id})

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {passwordHash, ...userWithoutPassword} = user
        return userWithoutPassword // Return user object *without* the hash
    } catch (error) {
        logger.error('Credential validation failed', error as Error)
        return null
    }
}
