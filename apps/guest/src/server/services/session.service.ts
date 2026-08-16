import bcrypt from 'bcryptjs'
import { prisma } from '@/server/db'
import { recordAudit } from '@/server/audit'
import { SessionNotActiveError, InvalidPinError } from '@/server/errors'
import type { VerifySessionInput } from '@/server/validation/session.schema'
import type { GuestSessionContext } from '@/server/require-guest-session'

/**
 * Guest PRD §2/§4 — the QR only ever identifies hotel + room, never
 * authenticates. `code_value` is opaque (already built for this by the
 * Hotel Admin module's qr_codes table) — this is the only thing the client
 * ever supplies to identify itself before verification.
 */
export async function resolveQrCode(codeValue: string) {
  const qr = await prisma.qr_codes.findUnique({
    where: { code_value: codeValue },
    include: { rooms: { include: { hotels: true } } },
  })

  if (!qr || !qr.is_active) {
    throw new SessionNotActiveError('invalid_qr', 'This RoomLink QR is not valid.')
  }
  if (qr.rooms.status !== 'active') {
    throw new SessionNotActiveError('room_inactive', 'RoomLink is currently unavailable for this room.')
  }

  const activeSession = await prisma.guest_sessions.findFirst({
    where: { hotel_id: qr.rooms.hotel_id, room_id: qr.rooms.room_id, status: 'active' },
  })
  if (!activeSession) {
    throw new SessionNotActiveError('no_active_stay', 'This RoomLink session is not currently active. Please contact Reception.')
  }
  if (activeSession.expires_at.getTime() <= Date.now()) {
    throw new SessionNotActiveError('session_expired', 'Your RoomLink session has expired.')
  }

  return {
    hotelId: qr.rooms.hotel_id,
    hotelName: qr.rooms.hotels.name,
    roomId: qr.rooms.room_id,
    roomNumber: qr.rooms.room_number,
  }
}

/**
 * PRD §5 — PIN + hotel + room + active stay, all derived server-side from
 * `codeValue`, never from a client-asserted hotel/room id. `bcrypt.compare`
 * is timing-safe by construction. Returns the session_token to be set as
 * the guest's cookie by the calling route handler (cookie mutation isn't
 * available from a plain service function in the App Router).
 */
export async function verifyGuestSession(input: VerifySessionInput) {
  const { hotelId, roomId } = await resolveQrCode(input.codeValue)

  const session = await prisma.guest_sessions.findFirst({
    where: { hotel_id: hotelId, room_id: roomId, status: 'active' },
  })
  // resolveQrCode already proved an active, unexpired session exists for
  // this room — re-check here defensively in case of a race between the
  // two calls, rather than assume it's still true a moment later.
  if (!session || session.expires_at.getTime() <= Date.now()) {
    throw new SessionNotActiveError('session_expired', 'Your RoomLink session has expired.')
  }

  const pinMatches = await bcrypt.compare(input.pin, session.pin_hash)
  if (!pinMatches) {
    throw new InvalidPinError('Incorrect PIN. Please try again.')
  }

  await recordAudit({
    actorId: session.guest_id,
    actorType: 'guest',
    action: 'guest_session.verified',
    entityType: 'guest_session',
    entityId: session.session_id,
  })

  return session
}

/** Guest PRD §8/§22 — Home + Profile's "who am I, where am I" read. */
export async function getMe(ctx: GuestSessionContext) {
  const session = await prisma.guest_sessions.findUniqueOrThrow({
    where: { session_id: ctx.sessionId },
    include: {
      hotels: { select: { name: true } },
      rooms: { select: { room_number: true } },
      guests: { select: { full_name: true, check_in_date: true, check_out_date: true } },
    },
  })

  return {
    hotelName: session.hotels.name,
    roomNumber: session.rooms.room_number,
    guestName: session.guests?.full_name ?? null,
    checkInDate: session.guests?.check_in_date ?? session.issued_at,
    checkOutDate: session.guests?.check_out_date ?? session.expires_at,
    status: session.status,
    expiresAt: session.expires_at,
  }
}

export async function endGuestSession(sessionId: string) {
  const before = await prisma.guest_sessions.findUniqueOrThrow({ where: { session_id: sessionId } })

  const after = await prisma.guest_sessions.update({
    where: { session_id: sessionId },
    data: { status: 'terminated', terminated_at: new Date() },
  })

  await recordAudit({
    actorId: before.guest_id,
    actorType: 'guest',
    action: 'guest_session.ended_by_guest',
    entityType: 'guest_session',
    entityId: sessionId,
    beforeState: { status: before.status },
  })

  return after
}
