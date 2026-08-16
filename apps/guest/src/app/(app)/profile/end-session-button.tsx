'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@roomlink/ui'

/** Guest PRD §23 — explicit logout, invalidates the session server-side (not just clears the cookie). */
export function EndSessionButton() {
  const [busy, setBusy] = useState(false)

  async function endSession() {
    setBusy(true)
    await fetch('/api/guest/session/end', { method: 'POST' })
    window.location.href = '/session-ended'
  }

  return (
    <Button variant="secondary" className="w-full" disabled={busy} onClick={endSession}>
      <LogOut className="h-4 w-4" aria-hidden />
      {busy ? 'Ending session…' : 'End Session'}
    </Button>
  )
}
