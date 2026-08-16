import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { updateUserSchema } from '@/server/validation/user.schema'
import { updateHotelAdmin } from '@/server/services/users.service'

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'users', 'edit')

    const body = updateUserSchema.parse(await req.json())
    const updated = await updateHotelAdmin(params.userId, body, user)

    return NextResponse.json({ userId: updated.user_id })
  } catch (error) {
    return toErrorResponse(error)
  }
}
