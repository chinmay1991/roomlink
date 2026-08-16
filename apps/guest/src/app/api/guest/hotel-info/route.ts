import { NextResponse } from 'next/server'
import { requireGuestSession } from '@/server/require-guest-session'
import { getHotelInfo } from '@/server/services/hotel-info.service'
import { toErrorResponse } from '@/server/api-error'

export async function GET() {
  try {
    const ctx = await requireGuestSession()
    const info = await getHotelInfo(ctx.hotelId)
    return NextResponse.json(info)
  } catch (error) {
    return toErrorResponse(error)
  }
}
