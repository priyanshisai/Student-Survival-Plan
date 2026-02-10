import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        // In Prisma 7, ensure your environment variables are loaded
        // if you are using Accelerate or specific drivers.
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;