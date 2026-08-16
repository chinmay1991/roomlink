import type { Prisma, actor_type } from '@prisma/client'
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
 * Every mutating route handler calls this — inside the same transaction as
 * the write it's logging — so audit_logs stays complete without hand-adding
 * a log call at every call site later. Pass the transaction client (`tx`)
 * when called from inside `prisma.$transaction(async (tx) => ...)`.
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
