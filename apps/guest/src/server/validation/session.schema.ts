import { z } from 'zod'

export const verifySessionSchema = z.object({
  codeValue: z.string().trim().min(1, 'Missing QR code'),
  pin: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit PIN'),
})
export type VerifySessionInput = z.infer<typeof verifySessionSchema>
