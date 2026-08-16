import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { toggleDepartmentEnabled } from '@/server/services/departments.service'

export async function POST(req: NextRequest, { params }: { params: { departmentId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_departments', 'edit')

    const department = await toggleDepartmentEnabled(user.hotelId, params.departmentId, user)
    return NextResponse.json(department)
  } catch (error) {
    return toErrorResponse(error)
  }
}
