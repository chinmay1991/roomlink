import { z } from 'zod'

export const replyToConversationSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(2000),
})
export type ReplyToConversationInput = z.infer<typeof replyToConversationSchema>
