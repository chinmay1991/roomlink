'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, StatusBadge } from '@roomlink/ui'

type ServiceRow = {
  service_id: string
  name: string
  description: string | null
  status: string
  departments: { name: string } | null
}

export function ServiceList({ services }: { services: ServiceRow[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)

  async function toggle(serviceId: string) {
    setBusyId(serviceId)
    await fetch(`/api/v1/hotel/services/${serviceId}/toggle`, { method: 'POST' })
    setBusyId(null)
    router.refresh()
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Service</th>
              <th className="px-5 py-3 font-medium">Department</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((s) => (
              <tr key={s.service_id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900">{s.name}</p>
                  {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
                </td>
                <td className="px-5 py-3 text-slate-600">{s.departments?.name ?? '—'}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={s.status} />
                </td>
                <td className="px-5 py-3 text-right">
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                    disabled={busyId === s.service_id}
                    onClick={() => toggle(s.service_id)}
                  >
                    {s.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">
                  No services configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
