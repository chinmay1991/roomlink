import { NextRequest, NextResponse } from 'next/server'
import { verifySessionSchema } from '@/server/validation/session.schema'
import { verifyGuestSession } from '@/server/services/session.service'
import { toErrorResponse } from '@/server/api-error'
import { GUEST_SESSION_COOKIE } from '@/server/require-guest-session'

export async function POST(req: NextRequest) {
  try {
    const body = verifySessionSchema.parse(await req.json())
    const session = await verifyGuestSession(body)

    const res = NextResponse.json({ ok: true })
    res.cookies.set(GUEST_SESSION_COOKIE, session.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: session.expires_at,
    })
    return res
  } catch (error) {
    return toErrorResponse(error)
  }
}
