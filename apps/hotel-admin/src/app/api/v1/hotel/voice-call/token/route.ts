import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { getStaffVoiceCallToken } from '@/server/services/voice-call.service'
import { toErrorResponse } from '@/server/api-error'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    return NextResponse.json(getStaffVoiceCallToken(user))
  } catch (error) {
    return toErrorResponse(error)
  }
}
