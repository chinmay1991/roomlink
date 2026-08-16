import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { setStaffDepartmentsSchema } from '@/server/validation/staff.schema'
import { setStaffDepartments } from '@/server/services/staff.service'

export async function PUT(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_staff', 'edit')

    const body = setStaffDepartmentsSchema.parse(await req.json())
    const updated = await setStaffDepartments(user.hotelId, params.userId, body.departmentIds, user)
    return NextResponse.json(updated)
  } catch (error) {
    return toErrorResponse(error)
  }
}
