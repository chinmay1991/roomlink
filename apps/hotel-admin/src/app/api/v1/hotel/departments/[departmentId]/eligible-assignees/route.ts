import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { listEligibleAssignees } from '@/server/services/requests.service'

export async function GET(req: NextRequest, { params }: { params: { departmentId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_requests', 'view')

    const result = await listEligibleAssignees(user.hotelId, params.departmentId)
    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}
