'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PROVIDERS_BY_TYPE } from '@/server/validation/integration.schema'

const TYPE_LABELS: Record<string, string> = { pms: 'PMS', payment_gateway: 'Payments', communication: 'Communication' }

export function AddIntegrationModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [integrationType, setIntegrationType] = useState<keyof typeof PROVIDERS_BY_TYPE>('pms')
  const [provider, setProvider] = useState<string>(PROVIDERS_BY_TYPE.pms[0])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onTypeChange(next: keyof typeof PROVIDERS_BY_TYPE) {
    setIntegrationType(next)
    setProvider(PROVIDERS_BY_TYPE[next][0])
  }

  async function onSubmit() {
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/v1/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ integrationType, provider, notes }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not add integration.')
      setSubmitting(false)
      return
    }
    onClose()
    router.refresh()
  }

  return (
    <Modal title="Add integration" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <Label htmlFor="type">Category</Label>
          <select
            id="type"
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={integrationType}
            onChange={(e) => onTypeChange(e.target.value as keyof typeof PROVIDERS_BY_TYPE)}
          >
            {Object.keys(PROVIDERS_BY_TYPE).map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="provider">Provider</Label>
          <select
            id="provider"
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            {PROVIDERS_BY_TYPE[integrationType].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Non-secret config notes only" />
          <p className="mt-1 text-xs text-slate-500">API keys/secrets go in environment variables, never here.</p>
        </div>

        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Adding…' : 'Add integration'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
