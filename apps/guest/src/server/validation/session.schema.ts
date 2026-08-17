import { z } from 'zod'

export const verifySessionSchema = z.object({
  codeValue: z.string().trim().min(1, 'Missing QR code'),
  // Loose shape check only — real normalization/matching happens in
  // session.service.ts's normalizePhone(), so a malformed value degrades to
  // the same generic "mismatch" response as a genuine wrong number, rather
  // than a distinct validation error that could act as an oracle.
  mobile: z.string().trim().min(6, 'Enter your mobile number').max(20),
})
export type VerifySessionInput = z.infer<typeof verifySessionSchema>
