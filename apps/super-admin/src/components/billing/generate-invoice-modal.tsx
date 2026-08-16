'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function GenerateInvoiceModal({
  hotels,
  onClose,
}: {
  hotels: { hotel_id: string; name: string }[]
  onClose: () => void
}) {
  const router = useRouter()
  const [hotelId, setHotelId] = useState(hotels[0]?.hotel_id ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/v1/billing/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotelId }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not generate invoice.')
      setSubmitting(false)
      return
    }
    onClose()
    router.refresh()
  }

  return (
    <Modal title="Generate invoice" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <Label htmlFor="hotel">Hotel</Label>
          <select
            id="hotel"
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
          >
            {hotels.map((h) => (
              <option key={h.hotel_id} value={h.hotel_id}>
                {h.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">Amount is pulled from the hotel&apos;s current subscription plan.</p>
        </div>

        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting || !hotelId}>
            {submitting ? 'Generating…' : 'Generate invoice'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
