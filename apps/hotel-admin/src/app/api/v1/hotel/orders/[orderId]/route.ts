import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { getOrder } from '@/server/services/orders.service'

export async function GET(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_orders', 'view')

    const order = await getOrder(user.hotelId, params.orderId)
    return NextResponse.json(order)
  } catch (error) {
    return toErrorResponse(error)
  }
}
