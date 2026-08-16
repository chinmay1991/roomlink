import { PrismaClient } from '@prisma/client'

/**
 * Single Prisma client shared by every app in the workspace (apps/super-admin,
 * apps/hotel-admin, …) — one schema, one database (`rmdb`), matching the
 * RoomLink dev rule against a second/unrelated database. Each app's own
 * src/server/db.ts just re-exports `prisma` from here.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export * from '@prisma/client'
