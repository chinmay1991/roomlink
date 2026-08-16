import Link from 'next/link'
import { requireGuestPageSession } from '@/server/require-guest-page-session'
import { listGuestOrders } from '@/server/services/orders.service'
import { Card, StatusBadge, timeAgo, formatCurrency } from '@roomlink/ui'

/** Guest PRD §18 — this stay's orders only. */
export default async function OrdersPage() {
  const ctx = await requireGuestPageSession()
  const orders = await listGuestOrders(ctx)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">My Orders</h1>

      <div className="space-y-3">
        {orders.map((o) => (
          <Link key={o.order_id} href={`/orders/${o.order_id}`}>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {o.order_items.map((oi) => (
                    <p key={oi.order_item_id} className="text-sm text-slate-800">
                      {oi.quantity} × {oi.menu_items.name}
                    </p>
                  ))}
                </div>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(o.created_at)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <StatusBadge status={o.status} />
                <span className="text-sm font-semibold text-slate-800">{formatCurrency(o.total_amount.toString())}</span>
              </div>
            </Card>
          </Link>
        ))}
        {orders.length === 0 && (
          <Card>
            <p className="px-4 py-10 text-center text-sm text-slate-500">No orders yet during this stay.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
