import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { toErrorResponse } from '@/server/api-error'
import { enableMfaSchema } from '@/server/validation/settings.schema'
import { enableMfa } from '@/server/services/mfa.service'

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req)
    const { secret, token } = enableMfaSchema.parse(await req.json())

    const result = await enableMfa(user.id, secret, token, user)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}
