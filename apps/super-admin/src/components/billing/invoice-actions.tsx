'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function InvoiceActions({ invoiceId, status }: { invoiceId: string; status: string }) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  async function post(action: string) {
    setPending(action)
    await fetch(`/api/v1/billing/invoices/${invoiceId}/${action}`, { method: 'POST' })
    setPending(null)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
      {status === 'draft' && (
        <button className="font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50" disabled={!!pending} onClick={() => post('send')}>
          {pending === 'send' ? 'Sending…' : 'Send'}
        </button>
      )}
      {(status === 'sent' || status === 'overdue') && (
        <button className="font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50" disabled={!!pending} onClick={() => post('mark-paid')}>
          {pending === 'mark-paid' ? 'Saving…' : 'Mark paid'}
        </button>
      )}
      {status === 'paid' && (
        <button className="text-red-600 hover:text-red-700 disabled:opacity-50" disabled={!!pending} onClick={() => post('refund')}>
          {pending === 'refund' ? 'Refunding…' : 'Refund'}
        </button>
      )}
      {(status === 'refunded' || status === 'cancelled') && <span className="text-xs text-slate-400">No actions</span>}
    </div>
  )
}
