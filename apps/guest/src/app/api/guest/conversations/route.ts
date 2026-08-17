import { NextRequest, NextResponse } from 'next/server'
import { requireGuestSession } from '@/server/require-guest-session'
import { sendMessageSchema } from '@/server/validation/conversation.schema'
import { sendGuestMessage, getGuestConversation } from '@/server/services/conversations.service'
import { toErrorResponse } from '@/server/api-error'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await requireGuestSession()
    const conversation = await getGuestConversation(ctx)
    return NextResponse.json(conversation)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireGuestSession()
    const body = sendMessageSchema.parse(await req.json())
    const message = await sendGuestMessage(ctx, body)
    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
