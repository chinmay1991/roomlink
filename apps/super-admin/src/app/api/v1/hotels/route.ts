import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { createHotelSchema } from '@/server/validation/hotel.schema'
import { createHotel } from '@/server/services/hotels.service'

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'hotels', 'create')

    const body = createHotelSchema.parse(await req.json())
    const result = await createHotel(body, user.id)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
