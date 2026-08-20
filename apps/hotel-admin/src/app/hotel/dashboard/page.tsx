import Link from 'next/link'
import { ClipboardList, Clock, Loader, CheckCircle2, BedDouble, Users, Building2, AlertTriangle, OctagonAlert } from 'lucide-react'
import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { isNativeClient } from '@/server/is-native-client'
import { getDashboardData } from '@/server/services/hotel-dashboard.service'
import { getHotelAlerts } from '@/server/services/alerts.service'
import { Card, CardHeader, CardBody, KpiCard } from '@roomlink/ui'
import { PollingRefresh } from '@/components/layout/polling-refresh'
import { DepartmentRow } from './department-row'
import { DepartmentSummaryCards } from './department-summary-cards'

export default async function DashboardPage() {
  const session = await requireHotelPageSession()
  const hotelId = session.user.hotelId
  const isNative = isNativeClient()
  const [{ kpis, departmentSummary }, alerts] = await Promise.all([getDashboardData(hotelId), getHotelAlerts(hotelId)])

  return (
    <div className="space-y-6">
      <PollingRefresh intervalSeconds={20} />
      <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        <KpiCard label="Today's requests" value={String(kpis.todaysRequests)} icon={ClipboardList} href="/hotel/requests" />
        <KpiCard
          label="Pending"
          value={String(kpis.pending)}
          icon={Clock}
          tone={kpis.pending > 0 ? 'warning' : 'default'}
          href="/hotel/requests?status=__pending_or_assigned__"
        />
        <KpiCard label="In progress" value={String(kpis.inProgress)} icon={Loader} href="/hotel/requests?status=in_progress" />
        <KpiCard label="Completed today" value={String(kpis.completed)} icon={CheckCircle2} href="/hotel/requests?status=completed" />
        <KpiCard label="Active rooms" value={String(kpis.activeRooms)} icon={BedDouble} href="/hotel/rooms" />
        <KpiCard label="Active staff" value={String(kpis.activeStaff)} icon={Users} href="/hotel/staff" />
        <KpiCard label="Departments" value={String(kpis.departmentCount)} icon={Building2} href="/hotel/departments" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Department summary</h2>
          </CardHeader>
          {isNative ? (
            <CardBody>
              <DepartmentSummaryCards departments={departmentSummary} />
            </CardBody>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Department</th>
                    <th className="px-5 py-2.5 font-medium">Pending</th>
                    <th className="px-5 py-2.5 font-medium">In progress</th>
                    <th className="px-5 py-2.5 font-medium">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departmentSummary.map((d) => (
                    <DepartmentRow
                      key={d.departmentId}
                      departmentId={d.departmentId}
                      name={d.name}
                      pending={d.pending}
                      inProgress={d.inProgress}
                      completed={d.completed}
                    />
                  ))}
                  {departmentSummary.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                        No departments enabled yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Alerts</h2>
          </CardHeader>
          <CardBody className="space-y-2 p-0">
            <ul className="divide-y divide-slate-100">
              {alerts.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <Link href={a.href} className="flex items-center gap-2 px-5 py-2.5 text-sm hover:bg-slate-50">
                    {a.severity === 'critical' ? (
                      <OctagonAlert className="h-3.5 w-3.5 shrink-0 text-red-600" aria-hidden />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
                    )}
                    <span className="text-slate-700">{a.message}</span>
                  </Link>
                </li>
              ))}
              {alerts.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-500">All clear.</li>}
            </ul>
          </CardBody>
        </Card>
      </div>

      <p className="text-xs text-slate-400">Updates automatically every 20 seconds.</p>
    </div>
  )
}
