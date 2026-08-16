import { prisma } from '@/server/db'
import { recordAudit } from '@/server/audit'

export const IMPERSONATION_COOKIE = 'rl_impersonation'
export const IMPERSONATION_MAX_AGE_SECONDS = 60 * 60 // 1 hour, per the PRD's "time-limited session" rule

export class NoHotelAdminError extends Error {}

export async function startImpersonation(hotelId: string, superAdminId: string, ip: string | null) {
  const hotelAdmin = await prisma.users.findFirst({
    where: { hotel_id: hotelId, user_type: 'hotel_admin' },
    orderBy: { created_at: 'asc' },
  })
  if (!hotelAdmin) throw new NoHotelAdminError()

  const session = await prisma.impersonation_sessions.create({
    data: { hotel_id: hotelId, super_admin_id: superAdminId, hotel_admin_id: hotelAdmin.user_id },
  })

  await recordAudit({
    actorId: superAdminId,
    actorType: 'super_admin',
    action: 'impersonation.started',
    entityType: 'hotel',
    entityId: hotelId,
    afterState: { session_id: session.session_id, hotel_admin_id: hotelAdmin.user_id },
    ipAddress: ip,
  })

  return session
}

export async function exitImpersonation(sessionId: string, actorId: string, ip: string | null) {
  const session = await prisma.impersonation_sessions.update({
    where: { session_id: sessionId },
    data: { ended_at: new Date() },
  })

  await recordAudit({
    actorId,
    actorType: 'super_admin',
    action: 'impersonation.ended',
    entityType: 'hotel',
    entityId: session.hotel_id,
    afterState: { session_id: sessionId },
    ipAddress: ip,
  })
}

export async function getActiveImpersonation(sessionId: string | undefined) {
  if (!sessionId) return null

  const session = await prisma.impersonation_sessions.findUnique({
    where: { session_id: sessionId },
    include: {
      hotels: { select: { name: true } },
      users_impersonation_sessions_hotel_admin_idTousers: { select: { full_name: true } },
    },
  })
  if (!session || session.ended_at) return null

  const expiresAt = new Date(session.started_at.getTime() + IMPERSONATION_MAX_AGE_SECONDS * 1000)
  if (expiresAt < new Date()) return null

  return {
    sessionId: session.session_id,
    hotelId: session.hotel_id,
    hotelName: session.hotels.name,
    hotelAdminName: session.users_impersonation_sessions_hotel_admin_idTousers?.full_name ?? 'Hotel Admin',
    expiresAt,
  }
}
