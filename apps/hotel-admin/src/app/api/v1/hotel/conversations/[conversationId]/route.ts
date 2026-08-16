import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { getConversation } from '@/server/services/conversations.service'

export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_conversations', 'view')

    const data = await getConversation(user.hotelId, params.conversationId)
    return NextResponse.json(data)
  } catch (error) {
    return toErrorResponse(error)
  }
}
