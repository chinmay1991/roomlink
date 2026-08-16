import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { requireCanHotel } from '@/server/hotel-rbac'
import { toErrorResponse } from '@/server/api-error'
import { listConversations } from '@/server/services/conversations.service'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    await requireCanHotel(user, 'hotel_conversations', 'view')

    const conversations = await listConversations(user.hotelId)
    return NextResponse.json(conversations)
  } catch (error) {
    return toErrorResponse(error)
  }
}
