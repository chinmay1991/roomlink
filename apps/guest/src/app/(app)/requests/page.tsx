import Link from 'next/link'
import { requireGuestPageSession } from '@/server/require-guest-page-session'
import { listGuestRequests } from '@/server/services/requests.service'
import { Card, timeAgo } from '@roomlink/ui'
import { toGuestRequestStatus, GUEST_REQUEST_STATUS_LABEL } from '@/lib/guest-status'

/** Guest PRD §14 — this stay's requests only (scoped server-side by `guest_session_id`). */
export default async function MyRequestsPage() {
  const ctx = await requireGuestPageSession()
  const requests = await listGuestRequests(ctx)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">My Requests</h1>

      <div className="space-y-3">
        {requests.map((r) => (
          <Link key={r.request_id} href={`/requests/${r.request_id}`}>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.request_type}</p>
                  <p className="text-xs text-slate-500">{r.departments?.name ?? 'General'}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(r.created_at)}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-brand-700">{GUEST_REQUEST_STATUS_LABEL[toGuestRequestStatus(r.status)]}</p>
            </Card>
          </Link>
        ))}
        {requests.length === 0 && (
          <Card>
            <p className="px-4 py-10 text-center text-sm text-slate-500">No requests yet during this stay.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
