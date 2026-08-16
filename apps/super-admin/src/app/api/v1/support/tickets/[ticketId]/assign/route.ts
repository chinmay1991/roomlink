import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { assignTicketToMe } from '@/server/services/support.service'

export async function POST(req: NextRequest, { params }: { params: { ticketId: string } }) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'support', 'edit')
    const updated = await assignTicketToMe(params.ticketId, user)
    return NextResponse.json({ status: updated.status, assignedTo: updated.assigned_to })
  } catch (error) {
    return toErrorResponse(error)
  }
}
