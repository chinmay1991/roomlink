import { ClipboardList, Clock, Loader, OctagonAlert, AlertTriangle, MessageSquareText, CheckCircle2 } from 'lucide-react'
import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { getReceptionDashboard, getDepartmentMonitoring } from '@/server/services/reception.service'
import { Card, CardHeader, KpiCard } from '@roomlink/ui'
import { PollingRefresh } from '@/components/layout/polling-refresh'
import { ClickableRow } from '@/components/layout/clickable-row'
import type { HotelSessionUser } from '@/server/require-hotel-session'

/** Reception PRD §5 — hotel-wide operational KPI row + a per-department breakdown (§22). */
export default async function ReceptionDashboardPage() {
  const session = await requireHotelPageSession()
  const actor = session.user as HotelSessionUser

  const [kpis, departments] = await Promise.all([
    getReceptionDashboard(actor.hotelId, actor),
    getDepartmentMonitoring(actor.hotelId, actor),
  ])

  return (
    <div className="space-y-6">
      <PollingRefresh intervalSeconds={10} />
      <h1 className="text-xl font-semibold text-slate-900">Reception Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        <KpiCard label="New today" value={String(kpis.newToday)} icon={ClipboardList} href="/hotel/requests" />
        <KpiCard
          label="Unassigned"
          value={String(kpis.unassigned)}
          icon={Clock}
          tone={kpis.unassigned > 0 ? 'warning' : 'default'}
          href="/hotel/requests?status=pending"
        />
        <KpiCard label="In progress" value={String(kpis.inProgress)} icon={Loader} href="/hotel/requests?status=in_progress" />
        <KpiCard
          label="Escalated"
          value={String(kpis.escalated)}
          icon={OctagonAlert}
          tone={kpis.escalated > 0 ? 'critical' : 'default'}
          href="/hotel/requests?status=escalated"
        />
        <KpiCard label="High priority" value={String(kpis.highPriority)} icon={AlertTriangle} tone={kpis.highPriority > 0 ? 'warning' : 'default'} />
        <KpiCard
          label="SLA at risk"
          value={String(kpis.slaAtRisk)}
          icon={AlertTriangle}
          tone={kpis.slaAtRisk > 0 ? 'warning' : 'default'}
          href="/hotel/requests"
        />
        <KpiCard
          label="Unread messages"
          value={String(kpis.unreadMessages)}
          icon={MessageSquareText}
          tone={kpis.unreadMessages > 0 ? 'warning' : 'default'}
          href="/hotel/reception-desk/conversations"
        />
        <KpiCard label="Completed today" value={String(kpis.completedToday)} icon={CheckCircle2} href="/hotel/requests?status=completed" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">By department</h2>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2.5 font-medium">Department</th>
                <th className="px-5 py-2.5 font-medium">New</th>
                <th className="px-5 py-2.5 font-medium">In progress</th>
                <th className="px-5 py-2.5 font-medium">Completed today</th>
                <th className="px-5 py-2.5 font-medium">Delayed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map((d) => (
                <ClickableRow key={d.department_id} href={`/hotel/requests?department=${d.department_id}`}>
                  <td className="px-5 py-2.5 font-medium text-slate-900">{d.name}</td>
                  <td className="px-5 py-2.5 tabular-nums text-slate-600">{d.newCount}</td>
                  <td className="px-5 py-2.5 tabular-nums text-slate-600">{d.inProgress}</td>
                  <td className="px-5 py-2.5 tabular-nums text-slate-600">{d.completedToday}</td>
                  <td className="px-5 py-2.5">
                    {d.delayed > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                        {d.delayed} delayed
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </ClickableRow>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                    No enabled departments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-slate-400">Updates automatically every 20 seconds.</p>
    </div>
  )
}
