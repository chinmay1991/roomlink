import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { declineVoiceCall } from '@/server/services/voice-call.service'
import { toErrorResponse } from '@/server/api-error'

export async function POST(req: NextRequest, { params }: { params: { zegoRoomId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    const callLog = await declineVoiceCall(user, params.zegoRoomId)
    return NextResponse.json(callLog)
  } catch (error) {
    return toErrorResponse(error)
  }
}
