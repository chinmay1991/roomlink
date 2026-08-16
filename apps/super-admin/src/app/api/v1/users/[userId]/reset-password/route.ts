import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { resetHotelAdminPassword } from '@/server/services/users.service'

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'users', 'edit')

    const tempPassword = await resetHotelAdminPassword(params.userId, user)
    return NextResponse.json({ tempPassword })
  } catch (error) {
    return toErrorResponse(error)
  }
}
