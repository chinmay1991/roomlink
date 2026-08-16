import { z } from 'zod'
import { uuid } from './common'

export const issueGuestSessionSchema = z.object({
  roomId: uuid,
  guestName: z.string().trim().max(150).optional().or(z.literal('')),
  hoursValid: z.coerce.number().int().min(1).max(168).default(48),
})
export type IssueGuestSessionInput = z.infer<typeof issueGuestSessionSchema>
