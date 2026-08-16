import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { updateHotelSettingsSchema } from '@/server/validation/hotel-settings.schema'
import { getHotelSettings, updateHotelSettings } from '@/server/services/hotel-settings.service'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_settings', 'view')

    const settings = await getHotelSettings(user.hotelId)
    return NextResponse.json(settings)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_settings', 'edit')

    const body = updateHotelSettingsSchema.parse(await req.json())
    const settings = await updateHotelSettings(user.hotelId, body, user)
    return NextResponse.json(settings)
  } catch (error) {
    return toErrorResponse(error)
  }
}
