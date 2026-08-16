import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { resetStaffAccess } from '@/server/services/staff.service'

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_staff', 'edit')

    const tempPassword = await resetStaffAccess(user.hotelId, params.userId, user)
    return NextResponse.json({ tempPassword })
  } catch (error) {
    return toErrorResponse(error)
  }
}
