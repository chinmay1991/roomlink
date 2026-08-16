'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, Input, Button, Select } from '@roomlink/ui'
import { DEFAULT_SERVICE_SUGGESTIONS } from '@/server/validation/service.schema'

type Department = { department_id: string; name: string }

export function AddService({ departments, existingNames }: { departments: Department[]; existingNames: string[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  const existing = new Set(existingNames)
  const selectedDept = departments.find((d) => d.department_id === departmentId)
  const suggestions = selectedDept ? (DEFAULT_SERVICE_SUGGESTIONS[selectedDept.name] ?? []).filter((s) => !existing.has(s)) : []

  async function add(serviceName: string) {
    if (!serviceName.trim() || !departmentId) return
    setBusy(true)
    const res = await fetch('/api/v1/hotel/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: serviceName.trim(), departmentId }),
    })
    setBusy(false)
    if (res.ok) {
      setName('')
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-slate-900">Add a service</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Department</label>
            <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-48">
              <option value="">Select…</option>
              {departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Custom service name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="w-56" placeholder="e.g. Newspaper" />
          </div>
          <Button variant="secondary" disabled={busy || !name.trim() || !departmentId} onClick={() => add(name)}>
            Add
          </Button>
        </div>

        {suggestions.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Quick add for {selectedDept?.name}</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <Button key={s} variant="secondary" className="h-8 px-3 text-xs" disabled={busy} onClick={() => add(s)}>
                  + {s}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
