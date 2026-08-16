import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Prisma } from '@roomlink/db'
import { requireGuestPageSession } from '@/server/require-guest-page-session'
import { getGuestRequestById } from '@/server/services/requests.service'
import { Card, formatDateTime } from '@roomlink/ui'
import { RequestStatusStepper } from '@/components/request-status-stepper'

/** Guest PRD §15 — request title, department, room, created time, status, guest note. */
export default async function RequestDetailPage({ params }: { params: { requestId: string } }) {
  const ctx = await requireGuestPageSession()

  const request = await getGuestRequestById(ctx, params.requestId).catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return null
    throw error
  })
  if (!request) notFound()

  return (
    <div className="space-y-5">
      <Link href="/requests" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="h-4 w-4" aria-hidden /> Back to My Requests
      </Link>

      <Card className="space-y-4 p-5">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{request.request_type}</h1>
          <p className="text-sm text-slate-500">
            Room {request.rooms?.room_number ?? '—'} · {request.departments?.name ?? 'General'}
          </p>
        </div>

        <RequestStatusStepper status={request.status} />

        {request.notes && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Note</p>
            <p className="text-sm text-slate-800">{request.notes}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Requested</p>
          <p className="text-sm text-slate-800">{formatDateTime(request.created_at)}</p>
        </div>
      </Card>
    </div>
  )
}
