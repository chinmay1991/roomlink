import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTicket } from '@/server/services/support.service'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDateTime, timeAgo } from '@/lib/format'
import { TicketStatusActions } from '@/components/support/ticket-status-actions'
import { TicketReplyForm } from '@/components/support/ticket-reply-form'

export default async function TicketDetailPage({ params }: { params: { ticketId: string } }) {
  const ticket = await getTicket(params.ticketId)
  if (!ticket) notFound()

  return (
    <div className="space-y-5">
      <Link href="/support" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to Support
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-slate-900">{ticket.subject}</h1>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="text-sm text-slate-500">
            {ticket.category} ·{' '}
            <Link href={`/hotels/${ticket.hotels.hotel_id}`} className="text-brand-600 hover:text-brand-700">
              {ticket.hotels.name}
            </Link>{' '}
            · opened by {ticket.users_support_tickets_raised_byTousers?.full_name ?? 'Unknown'} {timeAgo(ticket.created_at)}
          </p>
        </div>
        <TicketStatusActions ticketId={ticket.ticket_id} status={ticket.status} isAssigned={!!ticket.assigned_to} />
      </div>

      {ticket.description && (
        <Card className="p-5 text-sm text-slate-700">{ticket.description}</Card>
      )}

      <Card className="overflow-hidden">
        <div className="divide-y divide-slate-100">
          {ticket.ticket_messages.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-slate-500">No replies yet.</p>
          )}
          {ticket.ticket_messages.map((message) => (
            <div key={message.ticket_message_id} className="px-5 py-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">{message.users?.full_name ?? 'RoomLink HQ'}</span>
                <span className="text-xs text-slate-400">{formatDateTime(message.created_at)}</span>
              </div>
              <p className="text-sm text-slate-700">{message.content}</p>
            </div>
          ))}
        </div>
        <TicketReplyForm ticketId={ticket.ticket_id} />
      </Card>
    </div>
  )
}
