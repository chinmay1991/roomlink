import { prisma } from '@/server/db'

/**
 * Every hotel-admin mutation records actorId = the hotel-scoped user who
 * did it (see recordAudit calls throughout the service layer), so filtering
 * audit_logs by "actor is one of this hotel's users" gives an accurate
 * hotel activity feed without needing a hotel_id column on audit_logs
 * itself (PRD §17 — a basic log, not the full Super Admin audit trail).
 */
export async function listHotelActivity(hotelId: string, take = 50) {
  const users = await prisma.users.findMany({ where: { hotel_id: hotelId }, select: { user_id: true } })
  const userIds = users.map((u) => u.user_id)

  return prisma.audit_logs.findMany({
    where: { actor_id: { in: userIds } },
    orderBy: { created_at: 'desc' },
    take,
  })
}

/**
 * PRD §12: a Department Manager only sees their department's operational
 * activity — assignment, reassignment, status changes, notes, escalations,
 * cancellations, completion — not hotel-wide config changes (GST, staff
 * creation, subscription…) that `listHotelActivity` also surfaces to
 * hotel_admin. Scoped to `entity_type = 'request'` rows whose request
 * belongs to one of the caller's departments; no schema change.
 */
export async function listDepartmentActivity(hotelId: string, departmentIds: string[], take = 50) {
  const requestIds = await prisma.requests.findMany({
    where: { hotel_id: hotelId, department_id: { in: departmentIds } },
    select: { request_id: true },
  })

  return prisma.audit_logs.findMany({
    where: { entity_type: 'request', entity_id: { in: requestIds.map((r) => r.request_id) } },
    orderBy: { created_at: 'desc' },
    take,
  })
}
