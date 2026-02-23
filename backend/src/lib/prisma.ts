import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Use an explicit connection pool format in the environment variable. 
// E.g., DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10"
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
