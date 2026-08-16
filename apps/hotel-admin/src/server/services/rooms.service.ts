import { prisma } from '@/server/db'
import { recordAudit } from '@/server/audit'
import { markStepComplete } from '@/server/services/hotel-onboarding.service'
import type {
  CreateRoomInput,
  UpdateRoomInput,
  UpdateRoomStatusInput,
  BulkImportRoomsInput,
} from '@/server/validation/room.schema'
import type { HotelSessionUser } from '@/server/require-hotel-session'
import type { room_status } from '@roomlink/db'

async function getOrCreateRoomType(hotelId: string, name: string) {
  return prisma.room_types.upsert({
    where: { hotel_id_name: { hotel_id: hotelId, name } },
    update: {},
    create: { hotel_id: hotelId, name },
  })
}

export async function listRooms(hotelId: string, filters: { status?: room_status; floor?: string; q?: string }) {
  return prisma.rooms.findMany({
    where: {
      hotel_id: hotelId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.floor ? { floor: filters.floor } : {}),
      ...(filters.q ? { room_number: { contains: filters.q, mode: 'insensitive' } } : {}),
    },
    orderBy: [{ floor: 'asc' }, { room_number: 'asc' }],
    include: {
      room_types: { select: { name: true } },
      qr_codes: { select: { qr_code_id: true, is_active: true, installed_at: true } },
    },
  })
}

export async function createRoom(hotelId: string, input: CreateRoomInput, actor: HotelSessionUser) {
  const roomType = input.roomType ? await getOrCreateRoomType(hotelId, input.roomType) : null

  const room = await prisma.rooms.create({
    data: {
      hotel_id: hotelId,
      room_number: input.roomNumber,
      floor: input.floor || null,
      room_type_id: roomType?.room_type_id ?? null,
      status: 'active',
    },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: actor.userType,
    action: 'room.created',
    entityType: 'room',
    entityId: room.room_id,
    afterState: { room_number: room.room_number, floor: room.floor },
  })

  await markStepComplete(hotelId, 'Rooms')

  return room
}

export async function updateRoom(hotelId: string, roomId: string, input: UpdateRoomInput, actor: HotelSessionUser) {
  await prisma.rooms.findFirstOrThrow({ where: { room_id: roomId, hotel_id: hotelId } })
  const roomType = input.roomType ? await getOrCreateRoomType(hotelId, input.roomType) : null

  const after = await prisma.rooms.update({
    where: { room_id: roomId },
    data: {
      room_number: input.roomNumber,
      floor: input.floor || null,
      room_type_id: roomType?.room_type_id ?? null,
    },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: actor.userType,
    action: 'room.updated',
    entityType: 'room',
    entityId: roomId,
    afterState: { room_number: after.room_number, floor: after.floor },
  })

  return after
}

export async function updateRoomStatus(hotelId: string, roomId: string, input: UpdateRoomStatusInput, actor: HotelSessionUser) {
  const before = await prisma.rooms.findFirstOrThrow({ where: { room_id: roomId, hotel_id: hotelId } })

  const after = await prisma.rooms.update({ where: { room_id: roomId }, data: { status: input.status } })

  await recordAudit({
    actorId: actor.id,
    actorType: actor.userType,
    action: 'room.status_changed',
    entityType: 'room',
    entityId: roomId,
    beforeState: { status: before.status },
    afterState: { status: after.status },
  })

  return after
}

/** CSV/Excel bulk import (PRD §11) — rows are pre-parsed client-side; server just validates + upserts. */
export async function bulkImportRooms(hotelId: string, input: BulkImportRoomsInput, actor: HotelSessionUser) {
  const roomTypeCache = new Map<string, string>()

  const created = await prisma.$transaction(async (tx) => {
    const results = []
    for (const row of input.rows) {
      let roomTypeId: string | null = null
      if (row.roomType) {
        if (!roomTypeCache.has(row.roomType)) {
          const rt = await tx.room_types.upsert({
            where: { hotel_id_name: { hotel_id: hotelId, name: row.roomType } },
            update: {},
            create: { hotel_id: hotelId, name: row.roomType },
          })
          roomTypeCache.set(row.roomType, rt.room_type_id)
        }
        roomTypeId = roomTypeCache.get(row.roomType)!
      }

      const room = await tx.rooms.upsert({
        where: { hotel_id_room_number: { hotel_id: hotelId, room_number: row.roomNumber } },
        update: { floor: row.floor || null, room_type_id: roomTypeId },
        create: { hotel_id: hotelId, room_number: row.roomNumber, floor: row.floor || null, room_type_id: roomTypeId, status: 'active' },
      })
      results.push(room)
    }

    await recordAudit(
      {
        actorId: actor.id,
        actorType: actor.userType,
        action: 'room.bulk_imported',
        entityType: 'hotel',
        entityId: hotelId,
        afterState: { count: results.length },
      },
      tx
    )

    return results
  })

  await markStepComplete(hotelId, 'Rooms')

  return created
}
