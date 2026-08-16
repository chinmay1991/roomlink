import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { refundInvoice } from '@/server/services/billing.service'

export async function POST(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'billing', 'edit')
    const invoice = await refundInvoice(params.invoiceId, user)
    return NextResponse.json({ status: invoice.status })
  } catch (error) {
    return toErrorResponse(error)
  }
}
