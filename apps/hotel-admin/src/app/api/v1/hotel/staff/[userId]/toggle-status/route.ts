import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { toggleStaffStatus } from '@/server/services/staff.service'

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_staff', 'edit')

    const updated = await toggleStaffStatus(user.hotelId, params.userId, user)
    return NextResponse.json(updated)
  } catch (error) {
    return toErrorResponse(error)
  }
}
