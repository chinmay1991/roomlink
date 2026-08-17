import { z } from 'zod'
import { uuid } from './common'

// Loose shape check only — real normalization/validation happens in
// guest-sessions.service.ts via normalizePhone(), which throws a clear
// InvalidPhoneError for anything that doesn't parse.
const mobileInput = z.string().trim().min(6).max(20)

export const issueGuestSessionSchema = z.object({
  roomId: uuid,
  mobile: mobileInput,
  guestName: z.string().trim().max(150).optional().or(z.literal('')),
  hoursValid: z.coerce.number().int().min(1).max(168).default(48),
})
export type IssueGuestSessionInput = z.infer<typeof issueGuestSessionSchema>

export const updateGuestMobileSchema = z.object({
  mobile: mobileInput,
})
export type UpdateGuestMobileInput = z.infer<typeof updateGuestMobileSchema>
