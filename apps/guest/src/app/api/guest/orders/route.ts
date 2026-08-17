import { NextRequest, NextResponse } from 'next/server'
import { requireGuestSession } from '@/server/require-guest-session'
import { createOrderSchema } from '@/server/validation/order.schema'
import { createGuestOrder, listGuestOrders } from '@/server/services/orders.service'
import { toErrorResponse } from '@/server/api-error'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await requireGuestSession()
    const orders = await listGuestOrders(ctx)
    return NextResponse.json(orders)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireGuestSession()
    const body = createOrderSchema.parse(await req.json())
    const order = await createGuestOrder(ctx, body)
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
