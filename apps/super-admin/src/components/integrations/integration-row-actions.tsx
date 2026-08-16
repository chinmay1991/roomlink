'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function IntegrationRowActions({ integrationId, isActive }: { integrationId: string; isActive: boolean }) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  async function toggle() {
    setPending('toggle')
    await fetch(`/api/v1/integrations/${integrationId}/toggle`, { method: 'POST' })
    setPending(null)
    router.refresh()
  }

  async function remove() {
    setPending('remove')
    await fetch(`/api/v1/integrations/${integrationId}`, { method: 'DELETE' })
    setPending(null)
    router.refresh()
  }

  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      <button className="font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50" disabled={!!pending} onClick={toggle}>
        {pending === 'toggle' ? 'Saving…' : isActive ? 'Disable' : 'Enable'}
      </button>
      <button className="text-red-600 hover:text-red-700 disabled:opacity-50" disabled={!!pending} onClick={remove}>
        {pending === 'remove' ? 'Removing…' : 'Remove'}
      </button>
    </div>
  )
}
