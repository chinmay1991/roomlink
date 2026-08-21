'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AddDepartmentModal({
  hotelId,
  availableTemplates,
  onClose,
}: {
  hotelId: string
  availableTemplates: readonly string[]
  onClose: () => void
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(departmentName: string, isCustom: boolean) {
    if (!departmentName.trim()) return
    setSubmitting(true)
    setError(null)
    const res = await fetch(`/api/v1/hotels/${hotelId}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: departmentName.trim(), isCustom }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not add department.')
      setSubmitting(false)
      return
    }
    onClose()
    router.refresh()
  }

  return (
    <Modal title="Add department" onClose={onClose}>
      <div className="space-y-4">
        {availableTemplates.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Templates</p>
            <div className="flex flex-wrap gap-2">
              {availableTemplates.map((template) => (
                <Button
                  key={template}
                  type="button"
                  variant="secondary"
                  className="h-8 px-3 text-xs"
                  disabled={submitting}
                  onClick={() => onSubmit(template, false)}
                >
                  + {template}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="name">Custom department name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Valet Parking"
            maxLength={100}
          />
        </div>

        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(name, true)} disabled={submitting || !name.trim()}>
            {submitting ? 'Adding…' : 'Add department'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
