'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@roomlink/ui'

export function GoLiveButton({ disabled }: { disabled: boolean }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function onGoLive() {
    if (!confirm('Go live? Your hotel will move out of onboarding and RoomLink starts routing guest requests.')) return
    setSubmitting(true)
    await fetch('/api/v1/hotel/onboarding', { method: 'POST' })
    setSubmitting(false)
    router.refresh()
  }

  return (
    <Button onClick={onGoLive} disabled={disabled || submitting}>
      {submitting ? 'Going live…' : 'Go Live'}
    </Button>
  )
}
