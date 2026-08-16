import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { createServiceSchema } from '@/server/validation/service.schema'
import { listServices, createService } from '@/server/services/guest-services.service'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_services', 'view')

    const services = await listServices(user.hotelId)
    return NextResponse.json(services)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_services', 'create')

    const body = createServiceSchema.parse(await req.json())
    const service = await createService(user.hotelId, body, user)
    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
