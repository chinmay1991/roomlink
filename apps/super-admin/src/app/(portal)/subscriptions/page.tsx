import Link from 'next/link'
import { listSubscriptions } from '@/server/services/subscriptions.service'
import { prisma } from '@/server/db'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate } from '@/lib/format'
import { SubscriptionActions } from '@/components/subscriptions/subscription-actions'

export default async function SubscriptionsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const [subscriptions, plans] = await Promise.all([
    listSubscriptions({ status: searchParams.status }),
    prisma.subscription_plans.findMany({
      where: { is_active: true },
      orderBy: { price_amount: 'asc' },
      select: { plan_id: true, name: true, price_amount: true, billing_cycle: true },
    }),
  ])
  const planOptions = plans.map((p) => ({ ...p, price_amount: p.price_amount.toString() }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Subscriptions</h1>
        <p className="text-sm text-slate-500">{subscriptions.length} subscription{subscriptions.length === 1 ? '' : 's'} across all hotels.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Hotel</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Trial ends</th>
                <th className="px-5 py-3 font-medium">Auto-renew</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.map((sub) => (
                <tr key={sub.subscription_id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/hotels/${sub.hotels.hotel_id}`} className="font-medium text-slate-900 hover:text-brand-700">
                      {sub.hotels.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {sub.subscription_plans.name} · {formatCurrency(sub.subscription_plans.price_amount.toString())}/{sub.subscription_plans.billing_cycle}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-600">{sub.status === 'trial' ? formatDate(sub.trial_end_date) : '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{sub.auto_renew ? 'On' : 'Off'}</td>
                  <td className="px-5 py-3">
                    <SubscriptionActions
                      subscriptionId={sub.subscription_id}
                      status={sub.status}
                      autoRenew={sub.auto_renew}
                      planId={sub.plan_id}
                      plans={planOptions}
                    />
                  </td>
                </tr>
              ))}

              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                    No subscriptions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
