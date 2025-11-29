import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Logger } from '@/lib/utils/logger'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is missing')

const logger = new Logger('Prisma')

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// create adapter with your connection string
const adapter = new PrismaPg({
  connectionString: url,
})

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,               // <<-- pass the adapter here
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

prisma.$connect()
  .then(() => logger.info('Database connected successfully'))
  .catch((error) => {
    logger.critical('Database connection failed', error)
    process.exit(1)
  })

export default prisma
