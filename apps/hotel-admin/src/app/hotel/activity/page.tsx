import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { listHotelActivity } from '@/server/services/activity.service'
import { SectionTabs } from '@/components/layout/section-tabs'
import { Card, timeAgo } from '@roomlink/ui'

export default async function ActivityPage() {
  const session = await requireHotelPageSession()
  const entries = await listHotelActivity(session.user.hotelId)

  return (
    <div className="space-y-5">
      <SectionTabs section="operations" />
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
