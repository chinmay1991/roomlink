'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Modal, Textarea } from '@roomlink/ui'

type Service = { service_id: string; name: string; description: string | null }
type Group = { department_id: string | null; name: string; services: Service[] }

/** Guest PRD §11/§12 — category list → pick a service → quantity + note → submit. */
export function ServicePicker({ groups }: { groups: Group[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Service | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function openService(s: Service) {
    setSelected(s)
    setQuantity(1)
    setNote('')
    setError(null)
    setDone(false)
  }

  async function submit() {
    if (!selected) return
    setBusy(true)
    setError(null)
    const res = await fetch('/api/guest/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: selected.service_id, quantity, note: note.trim() || undefined }),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Unable to submit your request. Please try again.')
      return
    }
    setDone(true)
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.department_id ?? 'other'} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{g.name}</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {g.services.map((s) => (
              <button key={s.service_id} onClick={() => openService(s)} className="text-left">
                <Card className="h-full p-3.5 transition-colors hover:border-brand-300 hover:bg-brand-50">
                  <p className="text-sm font-medium text-slate-800">{s.name}</p>
                  {s.description && <p className="mt-0.5 text-xs text-slate-500">{s.description}</p>}
                </Card>
              </button>
            ))}
          </div>
        </div>
      ))}
      {groups.length === 0 && <p className="text-sm text-slate-500">No services are configured for this hotel yet.</p>}

      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          {done ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-slate-700">Your request has been submitted.</p>
              <Button
                className="w-full"
                onClick={() => {
                  setSelected(null)
                  router.push('/requests')
                }}
              >
                View My Requests
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {error && <p className="rounded-md bg-red-50 px-3.5 py-2 text-sm text-red-700">{error}</p>}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" className="h-9 w-9 p-0" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                    −
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                  <Button variant="secondary" className="h-9 w-9 p-0" onClick={() => setQuantity((q) => Math.min(20, q + 1))}>
                    +
                  </Button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Note (optional)</label>
                <Textarea rows={2} placeholder="e.g. Please bring after 8 PM." value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <Button className="w-full" disabled={busy} onClick={submit}>
                {busy ? 'Submitting…' : 'Submit Request'}
              </Button>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
