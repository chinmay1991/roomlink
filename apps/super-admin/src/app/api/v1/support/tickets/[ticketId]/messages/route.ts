import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { addMessageSchema } from '@/server/validation/support.schema'
import { addTicketMessage } from '@/server/services/support.service'

export async function POST(req: NextRequest, { params }: { params: { ticketId: string } }) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'support', 'edit')

    const { content } = addMessageSchema.parse(await req.json())
    const message = await addTicketMessage(params.ticketId, user.id, content)

    return NextResponse.json({ messageId: message.ticket_message_id }, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
