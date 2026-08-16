import { NextResponse } from 'next/server'
import { requireGuestSession } from '@/server/require-guest-session'
import { listMenu } from '@/server/services/menu.service'
import { toErrorResponse } from '@/server/api-error'

export async function GET() {
  try {
    const ctx = await requireGuestSession()
    const menu = await listMenu(ctx.hotelId)
    return NextResponse.json(menu)
  } catch (error) {
    return toErrorResponse(error)
  }
}
