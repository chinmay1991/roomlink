import { z } from 'zod'

export const createRoomSchema = z.object({
  roomNumber: z.string().trim().min(1, 'Room number is required').max(20),
  floor: z.string().trim().max(20).optional().or(z.literal('')),
  roomType: z.string().trim().max(100).optional().or(z.literal('')),
})
export type CreateRoomInput = z.infer<typeof createRoomSchema>

export const updateRoomStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'maintenance']),
})
export type UpdateRoomStatusInput = z.infer<typeof updateRoomStatusSchema>

export const updateRoomSchema = z.object({
  roomNumber: z.string().trim().min(1).max(20),
  floor: z.string().trim().max(20).optional().or(z.literal('')),
  roomType: z.string().trim().max(100).optional().or(z.literal('')),
})
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>

export const bulkImportRoomsSchema = z.object({
  rows: z
    .array(
      z.object({
        roomNumber: z.string().trim().min(1),
        floor: z.string().trim().optional().or(z.literal('')),
        roomType: z.string().trim().optional().or(z.literal('')),
      })
    )
    .min(1, 'No rows to import')
    .max(500, 'Import at most 500 rooms at a time'),
})
export type BulkImportRoomsInput = z.infer<typeof bulkImportRoomsSchema>
