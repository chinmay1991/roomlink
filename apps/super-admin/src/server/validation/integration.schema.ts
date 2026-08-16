import { z } from 'zod'

export const PROVIDERS_BY_TYPE = {
  pms: ['Oracle OPERA', 'IDS Next', 'eZee', 'Hotelogix'],
  payment_gateway: ['Razorpay', 'Stripe'],
  communication: ['WhatsApp', 'Twilio', 'Email', 'SMS'],
} as const

export const addIntegrationSchema = z.object({
  integrationType: z.enum(['pms', 'payment_gateway', 'communication']),
  provider: z.string().trim().min(1).max(100),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
})
