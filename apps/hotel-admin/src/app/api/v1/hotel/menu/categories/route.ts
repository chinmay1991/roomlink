import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { createCategorySchema } from '@/server/validation/menu.schema'
import { listCategories, createCategory } from '@/server/services/menu.service'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_menu', 'view')

    const categories = await listCategories(user.hotelId)
    return NextResponse.json(categories)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_menu', 'create')

    const body = createCategorySchema.parse(await req.json())
    const category = await createCategory(user.hotelId, body, user)
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
