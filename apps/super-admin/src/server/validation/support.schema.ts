import { z } from 'zod'

export const TICKET_CATEGORIES = [
  'Login',
  'QR Code',
  'Room Setup',
  'Menu Upload',
  'Staff Permissions',
  'Notifications',
  'Voice Calling',
  'Billing',
  'PMS Integration',
  'General',
]

export const addMessageSchema = z.object({ content: z.string().trim().min(1, 'Message cannot be empty').max(4000) })

export const changeTicketStatusSchema = z.object({
  status: z.enum(['open', 'assigned', 'in_progress', 'waiting_for_hotel', 'resolved', 'closed']),
})
