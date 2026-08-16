import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { terminateGuestSession } from '@/server/services/guest-sessions.service'

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_guest_sessions', 'edit')

    const session = await terminateGuestSession(user.hotelId, params.sessionId, user)
    return NextResponse.json(session)
  } catch (error) {
    return toErrorResponse(error)
  }
}
