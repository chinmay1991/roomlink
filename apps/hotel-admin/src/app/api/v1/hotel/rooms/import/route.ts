import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { bulkImportRoomsSchema } from '@/server/validation/room.schema'
import { bulkImportRooms } from '@/server/services/rooms.service'

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_rooms', 'create')

    const body = bulkImportRoomsSchema.parse(await req.json())
    const rooms = await bulkImportRooms(user.hotelId, body, user)
    return NextResponse.json({ count: rooms.length }, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
