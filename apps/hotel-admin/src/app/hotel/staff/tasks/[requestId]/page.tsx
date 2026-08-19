import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Prisma } from '@roomlink/db'
import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { getRequestById, getRequestHistory } from '@/server/services/requests.service'
import { Card, StatusBadge, formatDateTime } from '@roomlink/ui'
import { TaskDetailActions } from './task-detail-actions'
import type { HotelSessionUser } from '@/server/require-hotel-session'

/**
 * Staff PRD §9/§15 — task detail: room, request, guest name only (no
 * phone/email — data minimization), department, priority, created time,
 * assignee, status, guest message, and internal activity. Scoped through
 * `getRequestById`'s department-isolation check, so a deep link to another
 * department's request 404s rather than rendering.
 */
export default async function StaffTaskDetailPage({ params }: { params: { requestId: string } }) {
  const session = await requireHotelPageSession()
  const hotelId = session.user.hotelId
  const actor = session.user as HotelSessionUser

  // Both independently re-check department scope + request existence (each
  // is also its own standalone API route, so neither can skip that check) —
  // but nothing in either depends on the other's result, so run them
  // concurrently rather than paying two round trips back-to-back. Both throw
  // the same P2025 in the same not-found/out-of-scope cases (identical where
  // clause), so normalize each independently and let the request check drive
  // notFound().
  const [request, history] = await Promise.all([
    getRequestById(hotelId, params.requestId, actor).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return null
      throw error
    }),
    getRequestHistory(hotelId, params.requestId, actor).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return []
      throw error
    }),
  ])
  if (!request) notFound()

  const isMine = request.assigned_to === actor.id
  const isUnclaimed = request.status === 'pending'

  return (
    <div className="space-y-5 pb-6">
      <Link href="/hotel/staff/tasks" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="h-4 w-4" aria-hidden /> Back to tasks
      </Link>

      <Card className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold text-slate-900">Room {request.rooms?.room_number ?? '—'}</p>
            <p className="mt-0.5 text-base text-slate-700">{request.request_type}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          {request.departments && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
              {request.departments.name}
            </span>
          )}
          <StatusBadge status={request.priority} />
        </div>

        {request.guests?.full_name && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Guest</p>
            <p className="text-sm text-slate-800">{request.guests.full_name}</p>
          </div>
        )}

        {request.notes && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Guest message</p>
            <p className="text-sm text-slate-800">{request.notes}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Created</p>
            <p className="text-slate-800">{formatDateTime(request.created_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Assigned to</p>
            <p className="text-slate-800">{request.users?.full_name ?? 'Unassigned'}</p>
          </div>
        </div>
      </Card>

      <TaskDetailActions requestId={request.request_id} status={request.status} isMine={isMine} isUnclaimed={isUnclaimed} />

      {history.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {history.map((h) => (
              <li key={h.history_id} className="px-5 py-3 text-sm">
                <p className="text-slate-700">
                  {h.users_request_status_history_changed_byTousers?.full_name ?? 'System'}
                  {h.to_status && h.to_status !== h.from_status ? ` moved this to ${h.to_status.replace(/_/g, ' ')}` : ' added a note'}
                </p>
                {h.note && <p className="mt-0.5 text-xs text-slate-500">{h.note}</p>}
                <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(h.changed_at)}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
