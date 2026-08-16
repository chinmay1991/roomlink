'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye } from 'lucide-react'
import { Button, ButtonProps } from '@/components/ui/button'

export function ImpersonateButton({ hotelId, variant = 'secondary' }: { hotelId: string; variant?: ButtonProps['variant'] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClick() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/v1/hotels/${hotelId}/impersonate`, { method: 'POST' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not start impersonation.')
      setLoading(false)
      return
    }
    router.push(`/hotels/${hotelId}`)
    router.refresh()
  }

  return (
    <div>
      <Button variant={variant} onClick={onClick} disabled={loading}>
        <Eye className="h-3.5 w-3.5" aria-hidden />
        {loading ? 'Starting…' : 'Impersonate Hotel Admin'}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
