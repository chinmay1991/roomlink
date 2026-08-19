import Link from 'next/link'
import { ClipboardList, Clock, Loader, CheckCircle2, Users, AlertTriangle, OctagonAlert } from 'lucide-react'
import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { getManagerDepartmentIds, getManagerQueueKpis, getManagerQueueRequests } from '@/server/services/requests.service'
import { getManagerTeam } from '@/server/services/departments.service'
import { getDepartmentAlerts } from '@/server/services/alerts.service'
import { Card, CardHeader, CardBody, KpiCard, StatusBadge } from '@roomlink/ui'
import { PollingRefresh } from '@/components/layout/polling-refresh'
import { ClickableRow } from '@/components/layout/clickable-row'
import { RequestsBoard } from '../../requests/requests-board'
import type { HotelSessionUser } from '@/server/require-hotel-session'

/**
 * PRD §3: the Department Manager's post-login landing page — a focused
 * department work queue, not the hotel-wide `/hotel/dashboard`.
 */
export default async function ManagerQueuePage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string }
}) {
  const session = await requireHotelPageSession()
  const hotelId = session.user.hotelId
  const actor = session.user as HotelSessionUser

  const departmentIds = await getManagerDepartmentIds(hotelId, actor.id)

  if (departmentIds.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard / Queue</h1>
        <Card>
          <CardBody className="py-10 text-center text-sm text-slate-500">
            You are not currently assigned as the manager of any department.
          </CardBody>
        </Card>
      </div>
    )
  }

  const [kpis, requests, team, alerts] = await Promise.all([
    getManagerQueueKpis(hotelId, departmentIds),
    getManagerQueueRequests(hotelId, departmentIds),
    getManagerTeam(hotelId, departmentIds),
    getDepartmentAlerts(hotelId, departmentIds),
  ])

  return (
    <div className="space-y-6">
      <PollingRefresh intervalSeconds={10} />
      <h1 className="text-xl font-semibold text-slate-900">Dashboard / Queue</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="New today" value={String(kpis.newToday)} icon={ClipboardList} href="/hotel/manager/queue" />
        <KpiCard
          label="Unassigned"
          value={String(kpis.unassigned)}
          icon={Clock}
          tone={kpis.unassigned > 0 ? 'warning' : 'default'}
          href="/hotel/manager/queue?status=pending"
        />
        <KpiCard label="Assigned" value={String(kpis.assigned)} icon={Users} href="/hotel/manager/queue?status=assigned" />
        <KpiCard label="In progress" value={String(kpis.inProgress)} icon={Loader} href="/hotel/manager/queue?status=in_progress" />
        <KpiCard label="Completed today" value={String(kpis.completedToday)} icon={CheckCircle2} href="/hotel/manager/queue?status=completed" />
        <KpiCard
          label="Delayed / escalated"
          value={String(kpis.delayedOrEscalated)}
          icon={OctagonAlert}
          tone={kpis.delayedOrEscalated > 0 ? 'critical' : 'default'}
          href="/hotel/manager/queue?status=__delayed_or_escalated__"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Team availability</h2>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Name</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium">Active workload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.members.map((m) => (
                  <ClickableRow key={m.user_id} href={`/hotel/manager/queue?q=${encodeURIComponent(m.full_name)}`}>
                    <td className="px-5 py-2.5 font-medium text-slate-900">{m.full_name}</td>
                    <td className="px-5 py-2.5">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-5 py-2.5 tabular-nums text-slate-600">{m.activeWorkload}</td>
                  </ClickableRow>
                ))}
                {team.members.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-sm text-slate-500">
                      No staff in this department yet.
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

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Work queue</h2>
        <RequestsBoard
          key={`${searchParams.status ?? ''}|${searchParams.q ?? ''}`}
          initialStatusFilter={searchParams.status ?? ''}
          initialSearch={searchParams.q ?? ''}
          requests={requests.map((r) => ({
            request_id: r.request_id,
            request_type: r.request_type,
            status: r.status,
            priority: r.priority,
            notes: r.notes,
            created_at: r.created_at.toISOString(),
            rooms: r.rooms,
            guests: r.guests,
            departments: r.departments,
            users: r.users,
          }))}
          departments={team.departments}
          rooms={[]}
          canCreateRequests={false}
        />
      </div>
    </div>
  )
}
