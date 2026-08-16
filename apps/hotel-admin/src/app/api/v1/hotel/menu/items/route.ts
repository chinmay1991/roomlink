import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { createMenuItemSchema } from '@/server/validation/menu.schema'
import { listMenuItems, createMenuItem } from '@/server/services/menu.service'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_menu', 'view')

    const items = await listMenuItems(user.hotelId)
    return NextResponse.json(items)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_menu', 'create')

    const body = createMenuItemSchema.parse(await req.json())
    const item = await createMenuItem(user.hotelId, body, user)
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
