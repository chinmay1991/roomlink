import { z } from 'zod'
import { uuid } from './common'

export const createRequestSchema = z.object({
  serviceId: uuid,
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  note: z.string().trim().max(500).optional().or(z.literal('')),
})
export type CreateRequestInput = z.infer<typeof createRequestSchema>
