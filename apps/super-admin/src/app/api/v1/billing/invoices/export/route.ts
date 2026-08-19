import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { streamInvoicesCsv } from '@/server/services/billing.service'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'billing', 'view')

    const rows = streamInvoicesCsv()
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async pull(controller) {
        const { value, done } = await rows.next()
        if (done) {
          controller.close()
          return
        }
        controller.enqueue(encoder.encode(value))
      },
      cancel() {
        rows.return?.(undefined)
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="roomlink-invoices-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
