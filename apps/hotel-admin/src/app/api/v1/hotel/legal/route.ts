import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { updateHotelLegalSchema } from '@/server/validation/hotel-profile.schema'
import { getHotelProfile, updateHotelLegal } from '@/server/services/hotel-profile.service'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_profile', 'view')

    const hotel = await getHotelProfile(user.hotelId)
    return NextResponse.json(hotel)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_profile', 'edit')

    const body = updateHotelLegalSchema.parse(await req.json())
    const hotel = await updateHotelLegal(user.hotelId, body, user)
    return NextResponse.json(hotel)
  } catch (error) {
    return toErrorResponse(error)
  }
}
