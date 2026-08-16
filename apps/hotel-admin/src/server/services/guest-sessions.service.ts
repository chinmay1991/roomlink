import { randomBytes, randomInt } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/server/db'
import { recordAudit } from '@/server/audit'
import type { IssueGuestSessionInput } from '@/server/validation/guest-session.schema'
import type { HotelSessionUser } from '@/server/require-hotel-session'

export async function listGuestSessions(hotelId: string) {
  return prisma.guest_sessions.findMany({
    where: { hotel_id: hotelId },
    orderBy: { issued_at: 'desc' },
    include: { rooms: { select: { room_number: true } }, guests: { select: { full_name: true } } },
  })
}

/**
 * Reception/GM "check-in" action — the guest-facing scan+PIN redemption flow
 * itself is out of this module's build scope (confirmed decision), but
 * something has to issue the PIN a guest is handed at check-in, and the GM
 * needs to be able to see/terminate sessions (PRD §9), so a session has to
 * exist to view. PIN is returned once, never stored in the clear.
 */
export async function issueGuestSession(hotelId: string, input: IssueGuestSessionInput, actor: HotelSessionUser) {
  await prisma.rooms.findFirstOrThrow({ where: { room_id: input.roomId, hotel_id: hotelId } })

  // A photographed old QR must not grant access after checkout (PRD §12) —
  // enforced here by only ever having one active session per room at a time.
  await prisma.guest_sessions.updateMany({
    where: { hotel_id: hotelId, room_id: input.roomId, status: 'active' },
    data: { status: 'terminated', terminated_by: actor.id, terminated_at: new Date() },
  })

  const pin = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const pinHash = await bcrypt.hash(pin, 10)
  const sessionToken = randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + input.hoursValid * 60 * 60 * 1000)

  let guestId: string | null = null
  if (input.guestName) {
    const guest = await prisma.guests.create({
      data: { hotel_id: hotelId, room_id: input.roomId, full_name: input.guestName, check_in_date: new Date() },
    })
    guestId = guest.guest_id
  }

  const session = await prisma.guest_sessions.create({
    data: {
      hotel_id: hotelId,
      room_id: input.roomId,
      guest_id: guestId,
      session_token: sessionToken,
      pin_hash: pinHash,
      expires_at: expiresAt,
      status: 'active',
    },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: actor.userType,
    action: 'guest_session.issued',
    entityType: 'guest_session',
    entityId: session.session_id,
    afterState: { room_id: input.roomId },
  })

  return { session, pin }
}

export async function terminateGuestSession(hotelId: string, sessionId: string, actor: HotelSessionUser) {
  const before = await prisma.guest_sessions.findFirstOrThrow({ where: { session_id: sessionId, hotel_id: hotelId } })

  const after = await prisma.guest_sessions.update({
    where: { session_id: sessionId },
    data: { status: 'terminated', terminated_by: actor.id, terminated_at: new Date() },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: actor.userType,
    action: 'guest_session.terminated',
    entityType: 'guest_session',
    entityId: sessionId,
    beforeState: { status: before.status },
  })

  return after
}
