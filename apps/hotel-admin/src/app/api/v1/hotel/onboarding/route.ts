import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { toErrorResponse } from '@/server/api-error'
import { listOnboardingSteps, goLive } from '@/server/services/hotel-onboarding.service'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    const steps = await listOnboardingSteps(user.hotelId)
    return NextResponse.json(steps)
  } catch (error) {
    return toErrorResponse(error)
  }
}

/** POST = "Go Live". hotel_admin only — flips the hotel out of onboarding. */
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    if (user.userType !== 'hotel_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const hotel = await goLive(user.hotelId, user)
    return NextResponse.json(hotel)
  } catch (error) {
    return toErrorResponse(error)
  }
}
