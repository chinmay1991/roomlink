import { z } from 'zod'

/**
 * Postgres UUID format, not RFC-4122-version-strict — zod's built-in
 * `.uuid()` rejects otherwise-valid-looking ids that don't carry a v1-5
 * version nibble, which is stricter than anything our schema/Prisma cares
 * about.
 */
export const uuid = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid id')
