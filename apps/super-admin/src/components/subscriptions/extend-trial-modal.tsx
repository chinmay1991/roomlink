'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ExtendTrialModal({ subscriptionId, onClose }: { subscriptionId: string; onClose: () => void }) {
  const router = useRouter()
  const [days, setDays] = useState(7)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    setSubmitting(true)
    setError(null)
    const res = await fetch(`/api/v1/subscriptions/${subscriptionId}/extend-trial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not extend the trial.')
      setSubmitting(false)
      return
    }
    onClose()
    router.refresh()
  }

  return (
    <Modal title="Extend trial" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <Label htmlFor="days">Extend by (days)</Label>
          <Input id="days" type="number" min={1} max={90} value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </div>
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Extend trial'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
