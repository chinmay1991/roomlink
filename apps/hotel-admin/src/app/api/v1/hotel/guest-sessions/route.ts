import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { issueGuestSessionSchema } from '@/server/validation/guest-session.schema'
import { listGuestSessions, issueGuestSession } from '@/server/services/guest-sessions.service'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_guest_sessions', 'view')

    const sessions = await listGuestSessions(user.hotelId)
    return NextResponse.json(sessions)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_guest_sessions', 'create')

    const body = issueGuestSessionSchema.parse(await req.json())
    const result = await issueGuestSession(user.hotelId, body, user)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
