import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { listHotelOrders } from '@/server/services/orders.service'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_orders', 'view')

    const orders = await listHotelOrders(user.hotelId)
    return NextResponse.json(orders)
  } catch (error) {
    return toErrorResponse(error)
  }
}
