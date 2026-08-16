import { getHotelSupportTickets } from '@/server/services/hotels.service'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDateTime } from '@/lib/format'

export default async function HotelSupportPage({ params }: { params: { hotelId: string } }) {
  const tickets = await getHotelSupportTickets(params.hotelId)

  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        No support tickets raised by this hotel.
      </div>
    )
  }

  return (
    <Card className="divide-y divide-slate-100">
      {tickets.map((ticket) => (
        <div key={ticket.ticket_id} className="flex items-center justify-between px-5 py-3 text-sm">
          <div>
            <p className="font-medium text-slate-900">{ticket.subject}</p>
            <p className="text-xs text-slate-500">
              {ticket.category} · opened {formatDateTime(ticket.created_at)}
            </p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
      ))}
    </Card>
  )
}
