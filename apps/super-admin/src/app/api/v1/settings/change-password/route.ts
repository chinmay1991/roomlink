import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { toErrorResponse } from '@/server/api-error'
import { changePasswordSchema } from '@/server/validation/settings.schema'
import { changeOwnPassword } from '@/server/services/account.service'

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req)
    const { currentPassword, newPassword } = changePasswordSchema.parse(await req.json())

    const result = await changeOwnPassword(user.id, currentPassword, newPassword, user)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}
