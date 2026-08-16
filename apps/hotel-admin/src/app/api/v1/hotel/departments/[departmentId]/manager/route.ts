import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { assignManagerSchema } from '@/server/validation/department.schema'
import { setDepartmentManager } from '@/server/services/departments.service'

export async function PUT(req: NextRequest, { params }: { params: { departmentId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_managers', 'edit')

    const body = assignManagerSchema.parse(await req.json())
    const department = await setDepartmentManager(user.hotelId, params.departmentId, body.managerId, user)
    return NextResponse.json(department)
  } catch (error) {
    return toErrorResponse(error)
  }
}
