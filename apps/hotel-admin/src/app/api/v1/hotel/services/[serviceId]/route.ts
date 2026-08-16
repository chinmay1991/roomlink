import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { updateServiceSchema } from '@/server/validation/service.schema'
import { updateService } from '@/server/services/guest-services.service'

export async function PATCH(req: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_services', 'edit')

    const body = updateServiceSchema.parse(await req.json())
    const service = await updateService(user.hotelId, params.serviceId, body, user)
    return NextResponse.json(service)
  } catch (error) {
    return toErrorResponse(error)
  }
}
