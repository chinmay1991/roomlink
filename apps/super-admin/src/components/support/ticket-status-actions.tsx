'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NEXT_ACTIONS: Record<string, { status: string; label: string }[]> = {
  open: [{ status: 'closed', label: 'Close' }],
  assigned: [
    { status: 'in_progress', label: 'Start progress' },
    { status: 'waiting_for_hotel', label: 'Wait for hotel' },
    { status: 'closed', label: 'Close' },
  ],
  in_progress: [
    { status: 'waiting_for_hotel', label: 'Wait for hotel' },
    { status: 'resolved', label: 'Resolve' },
    { status: 'closed', label: 'Close' },
  ],
  waiting_for_hotel: [
    { status: 'in_progress', label: 'Resume progress' },
    { status: 'resolved', label: 'Resolve' },
    { status: 'closed', label: 'Close' },
  ],
  resolved: [
    { status: 'closed', label: 'Close' },
    { status: 'in_progress', label: 'Reopen' },
  ],
  closed: [{ status: 'in_progress', label: 'Reopen' }],
}

export function TicketStatusActions({
  ticketId,
  status,
  isAssigned,
}: {
  ticketId: string
  status: string
  isAssigned: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  async function assign() {
    setPending('assign')
    await fetch(`/api/v1/support/tickets/${ticketId}/assign`, { method: 'POST' })
    setPending(null)
    router.refresh()
  }

  async function setStatus(next: string) {
    setPending(next)
    await fetch(`/api/v1/support/tickets/${ticketId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    setPending(null)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'open' && !isAssigned && (
        <button
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          disabled={!!pending}
          onClick={assign}
        >
          {pending === 'assign' ? 'Assigning…' : 'Assign to me'}
        </button>
      )}
      {NEXT_ACTIONS[status]?.map((action) => (
        <button
          key={action.status}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          disabled={!!pending}
          onClick={() => setStatus(action.status)}
        >
          {pending === action.status ? 'Saving…' : action.label}
        </button>
      ))}
    </div>
  )
}
