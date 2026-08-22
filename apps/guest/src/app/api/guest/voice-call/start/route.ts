import { NextResponse } from 'next/server'
import { requireGuestSession } from '@/server/require-guest-session'
import { startVoiceCall } from '@/server/services/voice-call.service'
import { toErrorResponse } from '@/server/api-error'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const ctx = await requireGuestSession()
    const call = await startVoiceCall(ctx)
    return NextResponse.json(call, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
