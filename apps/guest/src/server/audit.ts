import type { Prisma, actor_type } from '@roomlink/db'
import { prisma } from '@/server/db'

type AuditEntry = {
  actorId: string | null
  actorType: actor_type
  action: string
  entityType: string
  entityId?: string | null
  beforeState?: unknown
  afterState?: unknown
  ipAddress?: string | null
}

/**
 * Mirrors apps/hotel-admin's src/server/audit.ts (same audit_logs table,
 * shared DB) — reimplemented per-app rather than shared, since audit is a
 * thin wrapper with no cross-app state (see architecture.md's "Reused
 * patterns" note).
 */
export async function recordAudit(entry: AuditEntry, tx: Prisma.TransactionClient | typeof prisma = prisma) {
  await tx.audit_logs.create({
    data: {
      actor_id: entry.actorId,
      actor_type: entry.actorType,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      before_state: entry.beforeState === undefined ? undefined : (entry.beforeState as Prisma.InputJsonValue),
      after_state: entry.afterState === undefined ? undefined : (entry.afterState as Prisma.InputJsonValue),
      ip_address: entry.ipAddress ?? null,
    },
  })
}

export function requestIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return headers.get('x-real-ip')
}
