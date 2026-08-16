import { z } from 'zod'

export const updateHotelSettingsSchema = z.object({
  welcomeMessage: z.string().trim().max(2000).optional().or(z.literal('')),
  guestInstructions: z.string().trim().max(2000).optional().or(z.literal('')),
  wifiName: z.string().trim().max(100).optional().or(z.literal('')),
  wifiPassword: z.string().trim().max(100).optional().or(z.literal('')),
  notifyCriticalRequests: z.boolean(),
  notifyUnassigned: z.boolean(),
  notifyGuestMessages: z.boolean(),
})
export type UpdateHotelSettingsInput = z.infer<typeof updateHotelSettingsSchema>
