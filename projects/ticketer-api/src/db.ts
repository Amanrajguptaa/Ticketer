import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as typeof globalThis & { __prisma?: PrismaClient }

/** Single PrismaClient instance (reused in dev to avoid too many connections). Run `npx prisma generate` after schema changes. */
export const prisma: PrismaClient = globalForPrisma.__prisma ?? (globalForPrisma.__prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : [],
}))
