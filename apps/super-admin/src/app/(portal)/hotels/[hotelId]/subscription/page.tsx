import { getHotelSubscription } from '@/server/services/hotels.service'
import { prisma } from '@/server/db'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate } from '@/lib/format'
import { SubscriptionActions } from '@/components/subscriptions/subscription-actions'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value}</dd>
    </div>
  )
}

export default async function HotelSubscriptionPage({ params }: { params: { hotelId: string } }) {
  const [subscription, plans] = await Promise.all([
    getHotelSubscription(params.hotelId),
    prisma.subscription_plans.findMany({
      where: { is_active: true },
      orderBy: { price_amount: 'asc' },
      select: { plan_id: true, name: true, price_amount: true, billing_cycle: true },
    }),
  ])

  if (!subscription) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        This hotel has no subscription on record.
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{subscription.subscription_plans.name} plan</h2>
        <StatusBadge status={subscription.status} />
      </CardHeader>
      <CardBody>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Price" value={`${formatCurrency(subscription.subscription_plans.price_amount.toString())} / ${subscription.subscription_plans.billing_cycle}`} />
          <Field label="Room limit" value={subscription.subscription_plans.room_limit ?? 'Unlimited'} />
          <Field label="Staff limit" value={subscription.subscription_plans.staff_limit ?? 'Unlimited'} />
          <Field label="Start date" value={formatDate(subscription.start_date)} />
          <Field label="Trial ends" value={formatDate(subscription.trial_end_date)} />
          <Field label="End date" value={formatDate(subscription.end_date)} />
          <Field label="Auto-renew" value={subscription.auto_renew ? 'Enabled' : 'Disabled'} />
        </dl>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <SubscriptionActions
            subscriptionId={subscription.subscription_id}
            status={subscription.status}
            autoRenew={subscription.auto_renew}
            planId={subscription.plan_id}
            plans={plans.map((p) => ({ ...p, price_amount: p.price_amount.toString() }))}
          />
        </div>
      </CardBody>
    </Card>
  )
}
