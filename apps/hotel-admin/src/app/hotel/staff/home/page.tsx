import Link from 'next/link'
import { ClipboardList, Loader, CheckCircle2 } from 'lucide-react'
import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { getStaffDepartmentIds, getStaffTaskSummary, listRequests } from '@/server/services/requests.service'
import { getDepartmentsByIds } from '@/server/services/departments.service'
import { Card, KpiCard } from '@roomlink/ui'
import { PollingRefresh } from '@/components/layout/polling-refresh'
import { StaffTaskList } from '../staff-task-list'
import { mapRequestRow } from '../map-request-row'
import type { HotelSessionUser } from '@/server/require-hotel-session'

const HOME_PREVIEW_LIMIT = 6

/** Staff PRD §5 — the mobile-first landing page: today's tallies + a quick look at what's open. */
export default async function StaffHomePage() {
  const session = await requireHotelPageSession()
  const hotelId = session.user.hotelId
  const actor = session.user as HotelSessionUser

  const departmentIds = await getStaffDepartmentIds(hotelId, actor.id)

  if (departmentIds.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">My Tasks</h1>
        <Card>
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            You are not currently assigned to any department. Ask your Hotel Admin to add you to one.
          </p>
        </Card>
      </div>
    )
  }

  const [summary, departments, requests] = await Promise.all([
    getStaffTaskSummary(hotelId, actor.id, departmentIds),
    getDepartmentsByIds(hotelId, departmentIds),
    listRequests(hotelId, {}, actor),
  ])

  return (
    <div className="space-y-5 pb-4">
      <PollingRefresh intervalSeconds={10} />
      <h1 className="text-xl font-semibold text-slate-900">My Tasks</h1>

      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="New"
          value={String(summary.newAvailable)}
          icon={ClipboardList}
          tone={summary.newAvailable > 0 ? 'warning' : 'default'}
          href="/hotel/staff/tasks?status=pending"
        />
        <KpiCard label="In progress" value={String(summary.myActive)} icon={Loader} href="/hotel/staff/tasks?status=in_progress" />
        <KpiCard label="Completed today" value={String(summary.completedToday)} icon={CheckCircle2} href="/hotel/staff/tasks?status=completed" />
      </div>

      <StaffTaskList
        requests={requests.map(mapRequestRow)}
        departments={departments}
        currentUserId={actor.id}
        showFilters={false}
        limit={HOME_PREVIEW_LIMIT}
        emptyMessage="No tasks in your department(s) right now."
      />

      {requests.length > HOME_PREVIEW_LIMIT && (
        <div className="text-center">
          <Link href="/hotel/staff/tasks" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all tasks →
          </Link>
        </div>
      )}
    </div>
  )
}
