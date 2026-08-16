import { requireGuestPageSession } from '@/server/require-guest-page-session'
import { getMe } from '@/server/services/session.service'
import { Card, formatDate } from '@roomlink/ui'
import { EndSessionButton } from './end-session-button'

/** Guest PRD §22 — lightweight, stay-scoped only. No permanent account, nothing editable here. */
export default async function ProfilePage() {
  const ctx = await requireGuestPageSession()
  const me = await getMe(ctx)

  const rows = [
    { label: 'Name', value: me.guestName ?? 'Not provided' },
    { label: 'Room', value: me.roomNumber },
    { label: 'Hotel', value: me.hotelName },
    { label: 'Check-in', value: formatDate(me.checkInDate) },
    { label: 'Check-out', value: formatDate(me.checkOutDate) },
  ]

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-900">Profile</h1>

      <Card className="divide-y divide-slate-100">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-slate-500">{r.label}</span>
            <span className="text-sm font-medium text-slate-900">{r.value}</span>
          </div>
        ))}
      </Card>

      <EndSessionButton />
    </div>
  )
}
