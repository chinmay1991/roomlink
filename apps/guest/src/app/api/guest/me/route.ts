import { NextResponse } from 'next/server'
import { requireGuestSession } from '@/server/require-guest-session'
import { getMe } from '@/server/services/session.service'
import { toErrorResponse } from '@/server/api-error'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await requireGuestSession()
    const me = await getMe(ctx)
    return NextResponse.json(me)
  } catch (error) {
    return toErrorResponse(error)
  }
}
