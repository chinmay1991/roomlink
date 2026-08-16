import { NextRequest, NextResponse } from 'next/server'
import { requireGuestSession } from '@/server/require-guest-session'
import { getGuestOrderById } from '@/server/services/orders.service'
import { toErrorResponse } from '@/server/api-error'

export async function GET(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const ctx = await requireGuestSession()
    const order = await getGuestOrderById(ctx, params.orderId)
    return NextResponse.json(order)
  } catch (error) {
    return toErrorResponse(error)
  }
}
