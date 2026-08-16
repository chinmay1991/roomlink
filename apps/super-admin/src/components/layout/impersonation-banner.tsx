'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ImpersonationBanner({
  hotelName,
  hotelAdminName,
  expiresAt,
}: {
  hotelName: string
  hotelAdminName: string
  expiresAt: string
}) {
  const router = useRouter()
  const [exiting, setExiting] = useState(false)

  const minutesLeft = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000))

  async function onExit() {
    setExiting(true)
    await fetch('/api/v1/impersonation/exit', { method: 'POST' })
    router.push('/hotels')
    router.refresh()
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-500 px-6 py-2 text-sm font-medium text-amber-950">
      <span className="flex items-center gap-2">
        <Eye className="h-4 w-4" aria-hidden />
        Impersonating <strong>{hotelAdminName}</strong> at <strong>{hotelName}</strong> · expires in ~{minutesLeft}m
      </span>
      <Button
        variant="secondary"
        className="border-amber-700 bg-amber-500 text-amber-950 hover:bg-amber-400"
        onClick={onExit}
        disabled={exiting}
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        {exiting ? 'Exiting…' : 'Exit impersonation'}
      </Button>
    </div>
  )
}
