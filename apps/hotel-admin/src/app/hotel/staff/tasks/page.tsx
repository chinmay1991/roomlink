import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { getStaffDepartmentIds, listRequests } from '@/server/services/requests.service'
import { getDepartmentsByIds } from '@/server/services/departments.service'
import { Card } from '@roomlink/ui'
import { StaffTaskList } from '../staff-task-list'
import { mapRequestRow } from '../map-request-row'
import type { HotelSessionUser } from '@/server/require-hotel-session'

/** Staff PRD §7 — the full, filterable task board (status / department / priority chips, room search not yet needed at pilot scale). */
export default async function StaffTasksPage() {
  const session = await requireHotelPageSession()
  const hotelId = session.user.hotelId
  const actor = session.user as HotelSessionUser

  const departmentIds = await getStaffDepartmentIds(hotelId, actor.id)

  if (departmentIds.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
        <Card>
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            You are not currently assigned to any department. Ask your Hotel Admin to add you to one.
          </p>
        </Card>
      </div>
    )
  }

  const [departments, requests] = await Promise.all([
    getDepartmentsByIds(hotelId, departmentIds),
    listRequests(hotelId, {}, actor),
  ])

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
      <StaffTaskList
        requests={requests.map(mapRequestRow)}
        departments={departments}
        currentUserId={actor.id}
        emptyMessage="No tasks match these filters."
      />
    </div>
  )
}
