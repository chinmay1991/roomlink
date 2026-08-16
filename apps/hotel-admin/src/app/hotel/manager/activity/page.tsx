import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { getManagerDepartmentIds } from '@/server/services/requests.service'
import { listDepartmentActivity } from '@/server/services/activity.service'
import { Card, timeAgo } from '@roomlink/ui'
import type { HotelSessionUser } from '@/server/require-hotel-session'

/** PRD §12: department operational activity only — not hotel-wide config/audit history. */
export default async function ManagerActivityPage() {
  const session = await requireHotelPageSession()
  const hotelId = session.user.hotelId
  const actor = session.user as HotelSessionUser

  const departmentIds = await getManagerDepartmentIds(hotelId, actor.id)
  const entries = departmentIds.length > 0 ? await listDepartmentActivity(hotelId, departmentIds) : []

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-900">Activity</h1>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {entries.map((e) => (
            <li key={e.log_id.toString()} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-slate-800">{e.action.replace(/_/g, ' ').replace(/\./g, ' — ')}</span>
              <span className="text-xs text-slate-400">{timeAgo(e.created_at)}</span>
            </li>
          ))}
          {entries.length === 0 && <li className="px-5 py-10 text-center text-sm text-slate-500">No activity yet.</li>}
        </ul>
      </Card>
    </div>
  )
}
