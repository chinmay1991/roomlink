import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { updateMenuItemSchema } from '@/server/validation/menu.schema'
import { updateMenuItem } from '@/server/services/menu.service'

export async function PATCH(req: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_menu', 'edit')

    const body = updateMenuItemSchema.parse(await req.json())
    const item = await updateMenuItem(user.hotelId, params.itemId, body, user)
    return NextResponse.json(item)
  } catch (error) {
    return toErrorResponse(error)
  }
}
