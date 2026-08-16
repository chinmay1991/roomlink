import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { updateRoomSchema } from '@/server/validation/room.schema'
import { updateRoom } from '@/server/services/rooms.service'

export async function PATCH(req: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_rooms', 'edit')

    const body = updateRoomSchema.parse(await req.json())
    const room = await updateRoom(user.hotelId, params.roomId, body, user)
    return NextResponse.json(room)
  } catch (error) {
    return toErrorResponse(error)
  }
}
