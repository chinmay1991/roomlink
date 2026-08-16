import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { toErrorResponse } from '@/server/api-error'
import { exitImpersonation, IMPERSONATION_COOKIE } from '@/server/services/impersonation.service'

export async function POST(req: NextRequest) {
  try {
    const { user, ip } = await requireSession(req)
    const sessionId = req.cookies.get(IMPERSONATION_COOKIE)?.value

    if (sessionId) {
      await exitImpersonation(sessionId, user.id, ip)
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.delete(IMPERSONATION_COOKIE)
    return res
  } catch (error) {
    return toErrorResponse(error)
  }
}
