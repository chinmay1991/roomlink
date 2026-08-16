import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { toggleServiceStatus } from '@/server/services/guest-services.service'

export async function POST(req: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_services', 'edit')

    const service = await toggleServiceStatus(user.hotelId, params.serviceId, user)
    return NextResponse.json(service)
  } catch (error) {
    return toErrorResponse(error)
  }
}
