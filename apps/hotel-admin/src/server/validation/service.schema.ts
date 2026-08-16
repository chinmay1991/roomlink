import { z } from 'zod'
import { uuid } from './common'

/** Default quick-add suggestions per department name, per PRD §15. */
export const DEFAULT_SERVICE_SUGGESTIONS: Record<string, string[]> = {
  Housekeeping: ['Extra Towels', 'Water', 'Toiletries', 'Pillow', 'Blanket', 'Room Cleaning'],
  Maintenance: ['AC Issue', 'TV Issue', 'Wi-Fi Issue', 'Plumbing', 'Electricity', 'Other'],
  Restaurant: ['Food ordering'],
}

export const createServiceSchema = z.object({
  name: z.string().trim().min(2, 'Service name is required').max(150),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  departmentId: uuid.nullable(),
})
export type CreateServiceInput = z.infer<typeof createServiceSchema>

export const updateServiceSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  departmentId: uuid.nullable(),
})
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
