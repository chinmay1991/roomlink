import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { escalateRequestSchema } from '@/server/validation/request.schema'
import { escalateRequest } from '@/server/services/requests.service'

export async function POST(req: NextRequest, { params }: { params: { requestId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_requests', 'edit')

    const body = escalateRequestSchema.parse(await req.json())
    const request = await escalateRequest(user.hotelId, params.requestId, body, user)
    return NextResponse.json(request)
  } catch (error) {
    return toErrorResponse(error)
  }
}
