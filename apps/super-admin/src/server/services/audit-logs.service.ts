import { Prisma } from '@prisma/client'
import { prisma } from '@/server/db'

const PAGE_SIZE = 25

export type AuditLogFilters = {
  entityType?: string
  actorType?: string
  q?: string
  page?: number
}

export async function listAuditLogs(filters: AuditLogFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1
  const where: Prisma.audit_logsWhereInput = {
    ...(filters.entityType ? { entity_type: filters.entityType } : {}),
    ...(filters.actorType ? { actor_type: filters.actorType as never } : {}),
    ...(filters.q ? { action: { contains: filters.q, mode: 'insensitive' } } : {}),
  }

  const [items, total, entityTypes] = await Promise.all([
    prisma.audit_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.audit_logs.count({ where }),
    prisma.audit_logs.findMany({ distinct: ['entity_type'], select: { entity_type: true }, orderBy: { entity_type: 'asc' } }),
  ])

  return {
    items,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    entityTypes: entityTypes.map((e) => e.entity_type),
  }
}
