import {Prisma, PrismaClient} from '@prisma/client';

// ✅ Extend PrismaClient to include $use
declare module '@prisma/client' {
    interface PrismaClient {
        $use(
            middleware: Prisma.Middleware
        ): void;
    }
}
