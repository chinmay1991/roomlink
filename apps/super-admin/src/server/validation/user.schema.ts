import { z } from 'zod'

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Name is required').max(150),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
