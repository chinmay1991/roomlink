import { NextResponse } from 'next/server'
import { requireGuestSession, GUEST_SESSION_COOKIE } from '@/server/require-guest-session'
import { endGuestSession } from '@/server/services/session.service'
import { toErrorResponse } from '@/server/api-error'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const ctx = await requireGuestSession()
    await endGuestSession(ctx.sessionId)

    const res = NextResponse.json({ ok: true })
    res.cookies.delete(GUEST_SESSION_COOKIE)
    return res
  } catch (error) {
    return toErrorResponse(error)
  }
}
