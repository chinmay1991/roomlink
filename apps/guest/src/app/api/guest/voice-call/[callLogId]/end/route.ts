import { NextRequest, NextResponse } from 'next/server'
import { requireGuestSession } from '@/server/require-guest-session'
import { endVoiceCall } from '@/server/services/voice-call.service'
import { toErrorResponse } from '@/server/api-error'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { callLogId: string } }) {
  try {
    const ctx = await requireGuestSession()
    const callLog = await endVoiceCall(ctx, params.callLogId)
    return NextResponse.json(callLog)
  } catch (error) {
    return toErrorResponse(error)
  }
}
