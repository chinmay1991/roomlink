import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { deactivateQrCode } from '@/server/services/qr-codes.service'

export async function POST(req: NextRequest, { params }: { params: { qrCodeId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_qr_codes', 'edit')

    const qr = await deactivateQrCode(user.hotelId, params.qrCodeId, user)
    return NextResponse.json(qr)
  } catch (error) {
    return toErrorResponse(error)
  }
}
