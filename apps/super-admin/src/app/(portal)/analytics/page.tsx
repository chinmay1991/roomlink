import {
  getBusinessMetrics,
  getOperationalMetrics,
  getGeographicBreakdown,
  getPlatformCharts,
} from '@/server/services/analytics.service'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { SimpleBarChart } from '@/components/analytics/simple-bar-chart'
import { formatCurrency } from '@/lib/format'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  )
}

function GeoList({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </CardHeader>
      <CardBody className="space-y-2">
        {rows.slice(0, 8).map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-slate-700">{row.label}</span>
            <span className="tabular-nums text-slate-500">{row.count}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-500">No data yet.</p>}
      </CardBody>
    </Card>
  )
}

export default async function AnalyticsPage() {
  const [business, operational, geo, charts] = await Promise.all([
    getBusinessMetrics(),
    getOperationalMetrics(),
    getGeographicBreakdown(),
    getPlatformCharts(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Platform-wide business and operational performance.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Business metrics</h2>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="MRR" value={formatCurrency(business.mrr)} />
          <Stat label="ARR" value={formatCurrency(business.arr)} />
          <Stat label="Churn rate" value={`${business.churnRate}%`} />
          <Stat label="Activation rate" value={`${business.activationRate}%`} />
          <Stat label="Trial conversion" value={`${business.trialConversionRate}%`} />
          <Stat label="Avg. onboarding time" value={business.avgOnboardingDays !== null ? `${business.avgOnboardingDays}d` : '—'} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Activation funnel</h2>
            <span className="text-xs text-slate-500">{charts.hotelsAddedThisMonth} added this month</span>
          </CardHeader>
          <CardBody>
            <SimpleBarChart data={charts.activationFunnel} dataKey="count" labelKey="status" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Requests processed platform-wide</h2>
            <span className="text-xs text-slate-500">{charts.totalRequests} total</span>
          </CardHeader>
          <CardBody>
            {charts.requestsByStatus.length > 0 ? (
              <SimpleBarChart data={charts.requestsByStatus} dataKey="count" labelKey="status" />
            ) : (
              <p className="py-16 text-center text-sm text-slate-500">No requests logged yet.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Operational metrics</h2>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Total chats" value={String(operational.totalChats)} />
          <Stat label="Voice calls" value="Coming soon" />
          <Stat label="Food orders" value={String(operational.foodOrders)} />
          <Stat label="Housekeeping requests" value={String(operational.housekeepingRequests)} />
          <Stat label="Maintenance tickets" value={String(operational.maintenanceTickets)} />
          <Stat label="Active users (30d)" value={String(operational.activeUsers)} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <GeoList title="Hotels by city" rows={geo.byCity} />
        <GeoList title="Hotels by state" rows={geo.byState} />
        <GeoList title="Hotels by country" rows={geo.byCountry} />
      </div>
    </div>
  )
}
