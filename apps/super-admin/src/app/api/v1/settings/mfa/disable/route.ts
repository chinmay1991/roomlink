import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { toErrorResponse } from '@/server/api-error'
import { disableMfa } from '@/server/services/mfa.service'

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req)
    await disableMfa(user.id, user)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}
