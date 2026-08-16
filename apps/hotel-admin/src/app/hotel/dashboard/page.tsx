import Link from 'next/link'
import { ClipboardList, Clock, Loader, CheckCircle2, BedDouble, Users, Building2, AlertTriangle, OctagonAlert } from 'lucide-react'
import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { getDashboardData } from '@/server/services/hotel-dashboard.service'
import { getHotelAlerts } from '@/server/services/alerts.service'
import { Card, CardHeader, CardBody, KpiCard } from '@roomlink/ui'

export default async function DashboardPage() {
  const session = await requireHotelPageSession()
  const hotelId = session.user.hotelId
  const [{ kpis, departmentSummary }, alerts] = await Promise.all([getDashboardData(hotelId), getHotelAlerts(hotelId)])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        <KpiCard label="Today's requests" value={String(kpis.todaysRequests)} icon={ClipboardList} />
        <KpiCard label="Pending" value={String(kpis.pending)} icon={Clock} tone={kpis.pending > 0 ? 'warning' : 'default'} />
        <KpiCard label="In progress" value={String(kpis.inProgress)} icon={Loader} />
        <KpiCard label="Completed today" value={String(kpis.completed)} icon={CheckCircle2} />
        <KpiCard label="Active rooms" value={String(kpis.activeRooms)} icon={BedDouble} />
        <KpiCard label="Active staff" value={String(kpis.activeStaff)} icon={Users} />
        <KpiCard label="Departments" value={String(kpis.departmentCount)} icon={Building2} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Department summary</h2>
          </CardHeader>
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
                  <tr key={d.name}>
                    <td className="px-5 py-2.5 font-medium text-slate-900">{d.name}</td>
                    <td className="px-5 py-2.5 tabular-nums text-slate-600">{d.pending}</td>
                    <td className="px-5 py-2.5 tabular-nums text-slate-600">{d.inProgress}</td>
                    <td className="px-5 py-2.5 tabular-nums text-slate-600">{d.completed}</td>
                  </tr>
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
    </div>
  )
}
