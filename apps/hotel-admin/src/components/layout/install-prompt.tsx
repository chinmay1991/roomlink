'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@roomlink/ui'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Ported from apps/super-admin (§21 of the Staff PRD: reuse the existing PWA setup, don't build a second one). */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  if (!deferredPrompt) return null

  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await deferredPrompt.prompt()
        await deferredPrompt.userChoice
        setDeferredPrompt(null)
      }}
    >
      <Download className="h-3.5 w-3.5" aria-hidden />
      Install app
    </Button>
  )
}
