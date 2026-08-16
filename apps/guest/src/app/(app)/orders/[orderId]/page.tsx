import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Prisma } from '@roomlink/db'
import { requireGuestPageSession } from '@/server/require-guest-page-session'
import { getGuestOrderById } from '@/server/services/orders.service'
import { Card, StatusBadge, formatCurrency, formatDateTime } from '@roomlink/ui'
import { GUEST_ORDER_STATUS_LABEL } from '@/lib/guest-status'

export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const ctx = await requireGuestPageSession()

  const order = await getGuestOrderById(ctx, params.orderId).catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return null
    throw error
  })
  if (!order) notFound()

  return (
    <div className="space-y-5">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="h-4 w-4" aria-hidden /> Back to My Orders
      </Link>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">Order</h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-sm font-medium text-brand-700">{GUEST_ORDER_STATUS_LABEL[order.status] ?? order.status}</p>

        <ul className="space-y-1.5 border-y border-slate-100 py-3">
          {order.order_items.map((oi) => (
            <li key={oi.order_item_id} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">
                {oi.quantity} × {oi.menu_items.name}
              </span>
              <span className="text-slate-500">{formatCurrency((Number(oi.unit_price) * oi.quantity).toString())}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">Total</span>
          <span className="text-lg font-semibold text-slate-900">{formatCurrency(order.total_amount.toString())}</span>
        </div>

        <p className="text-xs text-slate-400">Placed {formatDateTime(order.created_at)}</p>
      </Card>
    </div>
  )
}
