import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { createRoomSchema } from '@/server/validation/room.schema'
import { listRooms, createRoom } from '@/server/services/rooms.service'
import type { room_status } from '@roomlink/db'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_rooms', 'view')

    const { searchParams } = new URL(req.url)
    const rooms = await listRooms(user.hotelId, {
      status: (searchParams.get('status') as room_status) || undefined,
      floor: searchParams.get('floor') || undefined,
      q: searchParams.get('q') || undefined,
    })
    return NextResponse.json(rooms)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_rooms', 'create')

    const body = createRoomSchema.parse(await req.json())
    const room = await createRoom(user.hotelId, body, user)
    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
