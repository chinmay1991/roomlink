import { NextResponse } from 'next/server'
import { requireGuestSession } from '@/server/require-guest-session'
import { listEnabledServices } from '@/server/services/services.service'
import { toErrorResponse } from '@/server/api-error'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await requireGuestSession()
    const services = await listEnabledServices(ctx.hotelId)
    return NextResponse.json(services)
  } catch (error) {
    return toErrorResponse(error)
  }
}
