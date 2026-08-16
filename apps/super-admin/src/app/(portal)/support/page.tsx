import Link from 'next/link'
import { listTickets } from '@/server/services/support.service'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { timeAgo } from '@/lib/format'
import { TicketFilterBar } from '@/components/support/ticket-filter-bar'

export default async function SupportPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const tickets = await listTickets({ status: searchParams.status, category: searchParams.category })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Support Center</h1>
        <p className="text-sm text-slate-500">{tickets.length} ticket{tickets.length === 1 ? '' : 's'} across all hotels.</p>
      </div>

      <TicketFilterBar />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Ticket</th>
                <th className="px-5 py-3 font-medium">Hotel</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Assigned to</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Opened</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr key={ticket.ticket_id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/support/${ticket.ticket_id}`} className="font-medium text-slate-900 hover:text-brand-700">
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/hotels/${ticket.hotels.hotel_id}`} className="text-brand-600 hover:text-brand-700">
                      {ticket.hotels.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{ticket.category}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {ticket.users_support_tickets_assigned_toTousers?.full_name ?? 'Unassigned'}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-600">{timeAgo(ticket.created_at)}</td>
                </tr>
              ))}

              {tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                    No support tickets match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
