import { PrismaClient } from '@prisma/client';

// Singleton pattern — prevents connection pool exhaustion
// In development, Next.js hot-reload creates new modules each time,
// so we attach the client to globalThis to persist across reloads.

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
