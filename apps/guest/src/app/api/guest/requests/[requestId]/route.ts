import { NextRequest, NextResponse } from 'next/server'
import { requireGuestSession } from '@/server/require-guest-session'
import { getGuestRequestById } from '@/server/services/requests.service'
import { toErrorResponse } from '@/server/api-error'

export async function GET(req: NextRequest, { params }: { params: { requestId: string } }) {
  try {
    const ctx = await requireGuestSession()
    const request = await getGuestRequestById(ctx, params.requestId)
    return NextResponse.json(request)
  } catch (error) {
    return toErrorResponse(error)
  }
}
