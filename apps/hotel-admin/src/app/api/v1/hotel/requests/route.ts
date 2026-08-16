import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { createRequestSchema, requestFiltersSchema } from '@/server/validation/request.schema'
import { listRequests, createRequest } from '@/server/services/requests.service'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_requests', 'view')

    const { searchParams } = new URL(req.url)
    const filters = requestFiltersSchema.parse({
      departmentId: searchParams.get('departmentId') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      roomId: searchParams.get('roomId') || undefined,
    })

    const requests = await listRequests(user.hotelId, filters, user)
    return NextResponse.json(requests)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_requests', 'create')

    const body = createRequestSchema.parse(await req.json())
    const request = await createRequest(user.hotelId, body, user)
    return NextResponse.json(request, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
