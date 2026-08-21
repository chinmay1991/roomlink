import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { addDepartmentSchema } from '@/server/validation/department.schema'
import { addDepartment, listDepartments } from '@/server/services/departments.service'

export async function GET(req: NextRequest, { params }: { params: { hotelId: string } }) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'departments', 'view')

    const result = await listDepartments(params.hotelId)
    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(req: NextRequest, { params }: { params: { hotelId: string } }) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'departments', 'create')

    const body = addDepartmentSchema.parse(await req.json())
    const department = await addDepartment(params.hotelId, body, user)

    return NextResponse.json({ departmentId: department.department_id }, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
