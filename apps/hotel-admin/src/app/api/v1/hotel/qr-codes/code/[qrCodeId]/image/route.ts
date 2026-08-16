import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { getQrCodeForRoom } from '@/server/services/qr-codes.service'

/**
 * Renders the QR as a PNG on demand — nothing is stored as an image blob
 * (qr_codes.image_url is a VARCHAR, far too small for a data URI). Encodes
 * code_value only: per the PRD's security principle, the QR identifies
 * hotel + room, not a guest session, so there's nothing sensitive in it.
 */
export async function GET(req: NextRequest, { params }: { params: { qrCodeId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_qr_codes', 'view')

    const qr = await getQrCodeForRoom(user.hotelId, params.qrCodeId)
    const payload = `roomlink://${qr.rooms.hotel_id}/${qr.rooms.room_number}/${qr.code_value}`
    const png = await QRCode.toBuffer(payload, { type: 'png', width: 480, margin: 2 })

    const download = new URL(req.url).searchParams.get('download') === 'true'
    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="room-${qr.rooms.room_number}-qr.png"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
