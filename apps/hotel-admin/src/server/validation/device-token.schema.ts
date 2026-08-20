import { z } from 'zod'

export const registerDeviceTokenSchema = z.object({
  token: z.string().trim().min(10).max(500),
  platform: z.enum(['ios', 'android']),
})
export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>

export const unregisterDeviceTokenSchema = z.object({
  token: z.string().trim().min(10).max(500),
})
export type UnregisterDeviceTokenInput = z.infer<typeof unregisterDeviceTokenSchema>
