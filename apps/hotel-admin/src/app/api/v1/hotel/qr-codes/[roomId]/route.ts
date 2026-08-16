import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { generateQrCode, regenerateQrCode } from '@/server/services/qr-codes.service'

/** POST generates a fresh QR for the room (also used for "regenerate" — deactivates the old one). */
export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_qr_codes', 'create')

    const { searchParams } = new URL(req.url)
    const isRegenerate = searchParams.get('regenerate') === 'true'
    const qr = isRegenerate
      ? await regenerateQrCode(user.hotelId, params.roomId, user)
      : await generateQrCode(user.hotelId, params.roomId, user)

    return NextResponse.json(qr, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
