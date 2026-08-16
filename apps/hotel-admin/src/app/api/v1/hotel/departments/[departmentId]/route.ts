import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { renameDepartmentSchema } from '@/server/validation/department.schema'
import { renameDepartment } from '@/server/services/departments.service'

export async function PATCH(req: NextRequest, { params }: { params: { departmentId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_departments', 'edit')

    const body = renameDepartmentSchema.parse(await req.json())
    const department = await renameDepartment(user.hotelId, params.departmentId, body, user)
    return NextResponse.json(department)
  } catch (error) {
    return toErrorResponse(error)
  }
}
