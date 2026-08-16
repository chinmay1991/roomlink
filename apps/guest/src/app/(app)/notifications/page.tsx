import { Bell } from 'lucide-react'
import { requireGuestPageSession } from '@/server/require-guest-page-session'
import { getGuestNotifications } from '@/server/services/notifications.service'
import { Card, timeAgo } from '@roomlink/ui'

export default async function NotificationsPage() {
  const ctx = await requireGuestPageSession()
  const notifications = await getGuestNotifications(ctx)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {notifications.map((n) => (
            <li key={n.id} className="flex items-start gap-2.5 px-4 py-3.5">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
              <div>
                <p className="text-sm text-slate-800">{n.message}</p>
                <p className="text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
              </div>
            </li>
          ))}
          {notifications.length === 0 && <li className="px-4 py-10 text-center text-sm text-slate-500">No notifications yet.</li>}
        </ul>
      </Card>
    </div>
  )
}
