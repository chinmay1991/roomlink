import { z } from 'zod'
import { uuid } from './common'

export const createOrderSchema = z.object({
  items: z
    .array(z.object({ itemId: uuid, quantity: z.coerce.number().int().min(1).max(20) }))
    .min(1, 'Your cart is empty'),
})
export type CreateOrderInput = z.infer<typeof createOrderSchema>
