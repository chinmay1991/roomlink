import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { changeTicketStatusSchema } from '@/server/validation/support.schema'
import { changeTicketStatus } from '@/server/services/support.service'

export async function POST(req: NextRequest, { params }: { params: { ticketId: string } }) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'support', 'edit')

    const { status } = changeTicketStatusSchema.parse(await req.json())
    const updated = await changeTicketStatus(params.ticketId, status, user)

    return NextResponse.json({ status: updated.status })
  } catch (error) {
    return toErrorResponse(error)
  }
}
