'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    await fetch(`/api/v1/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    setContent('')
    setSubmitting(false)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2 border-t border-slate-100 p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Reply to the hotel…"
        rows={2}
        className="block w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <Button type="submit" disabled={submitting || !content.trim()}>
        {submitting ? 'Sending…' : 'Send'}
      </Button>
    </form>
  )
}
