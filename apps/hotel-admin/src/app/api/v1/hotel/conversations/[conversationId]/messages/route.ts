import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { replyToConversationSchema } from '@/server/validation/conversation.schema'
import { replyToConversation } from '@/server/services/conversations.service'

export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_conversations', 'edit')

    const body = replyToConversationSchema.parse(await req.json())
    const message = await replyToConversation(user.hotelId, params.conversationId, body, user)
    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
