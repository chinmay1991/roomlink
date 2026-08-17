import { NextResponse } from 'next/server'
import { requireGuestSession } from '@/server/require-guest-session'
import { getGuestNotifications } from '@/server/services/notifications.service'
import { toErrorResponse } from '@/server/api-error'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await requireGuestSession()
    const notifications = await getGuestNotifications(ctx)
    return NextResponse.json(notifications)
  } catch (error) {
    return toErrorResponse(error)
  }
}
