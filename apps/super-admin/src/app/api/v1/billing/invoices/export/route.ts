import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { exportInvoicesCsv } from '@/server/services/billing.service'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'billing', 'view')

    const csv = await exportInvoicesCsv()
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="roomlink-invoices-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
