import Link from 'next/link'
import { Building2, DoorOpen, Users, LifeBuoy, CreditCard, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react'
import { getPlatformKpis, getAlerts } from '@/server/services/analytics.service'
import { getMrrArr, getActiveHotelAdminCount } from '@/server/services/billing.service'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { Card } from '@/components/ui/card'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export default async function DashboardPage() {
  const [kpis, { mrr, arr }, activeHotelAdmins, alerts] = await Promise.all([
    getPlatformKpis(),
    getMrrArr(),
    getActiveHotelAdminCount(),
    getAlerts(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Real-time overview of the RoomLink platform.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Hotels" value={String(kpis.totalHotels)} icon={Building2} />
        <KpiCard label="Active Hotels" value={String(kpis.activeHotels)} icon={Building2} />
        <KpiCard label="Hotels in Trial" value={String(kpis.trialHotels)} icon={Building2} />
        <KpiCard label="Hotels Onboarding" value={String(kpis.onboardingHotels)} icon={Building2} />
        <KpiCard label="Total Rooms" value={String(kpis.totalRooms)} icon={DoorOpen} />
        <KpiCard label="Monthly Recurring Revenue" value={currency.format(mrr)} icon={TrendingUp} />
        <KpiCard label="Annual Recurring Revenue" value={currency.format(arr)} icon={TrendingUp} />
        <KpiCard label="Active Hotel Admins" value={String(activeHotelAdmins)} icon={Users} />
        <KpiCard
          label="Open Support Tickets"
          value={String(kpis.openSupportTickets)}
          icon={LifeBuoy}
          tone={kpis.openSupportTickets > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          label="Failed Payments"
          value={String(kpis.failedPayments)}
          icon={CreditCard}
          tone={kpis.failedPayments > 0 ? 'critical' : 'default'}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
            Alerts
          </h2>
          <span className="text-xs text-slate-500">{alerts.length} active</span>
        </div>
        {alerts.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-slate-500">Nothing needs attention right now.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {alerts.map((alert, i) => (
              <li key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className={alert.severity === 'critical' ? 'text-red-700' : 'text-amber-700'}>{alert.message}</span>
                {alert.hotelId && (
                  <Link href={`/hotels/${alert.hotelId}`} className="font-medium text-slate-600 hover:text-brand-700">
                    {alert.hotelName}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        <div className="mb-1 flex items-center gap-2 font-medium text-slate-700">
          <BarChart3 className="h-4 w-4" aria-hidden />
          Trend charts
        </div>
        <p>
          Hotels added this month, the activation funnel, and requests processed are on the{' '}
          <Link href="/analytics" className="text-brand-600 hover:text-brand-700">Analytics</Link> page. Revenue
          growth and daily-active-hotels charts need historical snapshots this schema doesn&apos;t retain yet — it
          stores point-in-time status, not a time series.
        </p>
      </div>
    </div>
  )
}
