import { z } from 'zod'

/**
 * Postgres UUID format, not RFC-4122-version-strict — matches
 * apps/hotel-admin's own `common.ts` rationale (Prisma/Postgres don't care
 * about the version nibble zod's built-in `.uuid()` insists on).
 */
export const uuid = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid id')
