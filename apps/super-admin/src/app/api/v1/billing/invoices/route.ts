import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { generateInvoiceSchema } from '@/server/validation/billing.schema'
import { generateInvoice } from '@/server/services/billing.service'

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'billing', 'create')

    const { hotelId } = generateInvoiceSchema.parse(await req.json())
    const invoice = await generateInvoice(hotelId, user)

    return NextResponse.json({ invoiceId: invoice.invoice_id, invoiceNumber: invoice.invoice_number }, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
