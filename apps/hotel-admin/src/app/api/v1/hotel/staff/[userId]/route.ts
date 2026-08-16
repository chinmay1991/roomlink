import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { updateStaffSchema } from '@/server/validation/staff.schema'
import { updateStaff } from '@/server/services/staff.service'

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_staff', 'edit')

    const body = updateStaffSchema.parse(await req.json())
    const updated = await updateStaff(user.hotelId, params.userId, body, user)
    return NextResponse.json(updated)
  } catch (error) {
    return toErrorResponse(error)
  }
}
