'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, Button, Input } from '@roomlink/ui'

export function EnableDepartment({ availableTemplates }: { availableTemplates: readonly string[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [customName, setCustomName] = useState('')

  async function enable(name: string, isCustom: boolean) {
    setBusy(name)
    const res = await fetch('/api/v1/hotel/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, isCustom }),
    })
    setBusy(null)
    if (res.ok) {
      setCustomName('')
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-slate-900">Add a department</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        {availableTemplates.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Templates</p>
            <div className="flex flex-wrap gap-2">
              {availableTemplates.map((name) => (
                <Button
                  key={name}
                  variant="secondary"
                  className="h-8 px-3 text-xs"
                  disabled={busy === name}
                  onClick={() => enable(name, false)}
                >
                  + {name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Custom department</p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Valet Parking"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="max-w-xs"
            />
            <Button
              variant="secondary"
              disabled={!customName.trim() || busy === customName}
              onClick={() => enable(customName.trim(), true)}
            >
              Add
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
