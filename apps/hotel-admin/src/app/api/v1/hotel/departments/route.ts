import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { enableDepartmentSchema } from '@/server/validation/department.schema'
import { listDepartments, enableDepartment } from '@/server/services/departments.service'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_departments', 'view')

    const result = await listDepartments(user.hotelId)
    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_departments', 'create')

    const body = enableDepartmentSchema.parse(await req.json())
    const department = await enableDepartment(user.hotelId, body, user)
    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
