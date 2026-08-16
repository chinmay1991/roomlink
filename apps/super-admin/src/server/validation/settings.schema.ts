import { z } from 'zod'

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'At least 8 characters'),
})

export const enableMfaSchema = z.object({
  secret: z.string().min(1),
  token: z.string().length(6, 'Enter the 6-digit code'),
})
