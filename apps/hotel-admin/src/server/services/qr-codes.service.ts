import { randomBytes } from 'crypto'
import { prisma } from '@/server/db'
import { recordAudit } from '@/server/audit'
import { markStepComplete } from '@/server/services/hotel-onboarding.service'
import type { HotelSessionUser } from '@/server/require-hotel-session'

function generateCodeValue() {
  return randomBytes(16).toString('hex')
}

/**
 * Security principle (PRD §12): the QR only identifies hotel + room, never
 * a guest — code_value is an opaque, unguessable token, not a session. Guest
 * auth/session is a separate concern (guest_sessions), out of this app's
 * scope per the confirmed build decision.
 */
export async function generateQrCode(hotelId: string, roomId: string, actor: HotelSessionUser) {
  await prisma.rooms.findFirstOrThrow({ where: { room_id: roomId, hotel_id: hotelId } })

  // Deactivate any existing active QR for this room first — one active QR per room.
  await prisma.qr_codes.updateMany({ where: { room_id: roomId, is_active: true }, data: { is_active: false } })

  const qr = await prisma.qr_codes.create({
    data: { room_id: roomId, code_value: generateCodeValue(), generated_by: actor.id, is_active: true },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: actor.userType,
    action: 'qr_code.generated',
    entityType: 'qr_code',
    entityId: qr.qr_code_id,
    afterState: { room_id: roomId },
  })

  await markStepComplete(hotelId, 'QR Codes')

  return qr
}

export async function regenerateQrCode(hotelId: string, roomId: string, actor: HotelSessionUser) {
  return generateQrCode(hotelId, roomId, actor)
}

export async function markQrInstalled(hotelId: string, qrCodeId: string, actor: HotelSessionUser) {
  const qr = await prisma.qr_codes.findFirstOrThrow({
    where: { qr_code_id: qrCodeId, rooms: { hotel_id: hotelId } },
  })

  const after = await prisma.qr_codes.update({ where: { qr_code_id: qr.qr_code_id }, data: { installed_at: new Date() } })

  await recordAudit({
    actorId: actor.id,
    actorType: actor.userType,
    action: 'qr_code.marked_installed',
    entityType: 'qr_code',
    entityId: qrCodeId,
  })

  return after
}

export async function deactivateQrCode(hotelId: string, qrCodeId: string, actor: HotelSessionUser) {
  const qr = await prisma.qr_codes.findFirstOrThrow({
    where: { qr_code_id: qrCodeId, rooms: { hotel_id: hotelId } },
  })

  const after = await prisma.qr_codes.update({ where: { qr_code_id: qr.qr_code_id }, data: { is_active: false } })

  await recordAudit({
    actorId: actor.id,
    actorType: actor.userType,
    action: 'qr_code.deactivated',
    entityType: 'qr_code',
    entityId: qrCodeId,
  })

  return after
}

/** For the printable/downloadable image route — no hotel_id filter needed since code_value is opaque/unguessable and the route only ever renders the image, not guest access. Callers must still authorize via requireHotelSession + check room ownership. */
export async function getQrCodeForRoom(hotelId: string, qrCodeId: string) {
  return prisma.qr_codes.findFirstOrThrow({
    where: { qr_code_id: qrCodeId, rooms: { hotel_id: hotelId } },
    include: { rooms: { select: { room_number: true, hotel_id: true } } },
  })
}
