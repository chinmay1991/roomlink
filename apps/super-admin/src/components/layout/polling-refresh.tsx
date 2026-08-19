'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * No realtime infra (websocket/SSE) exists in this codebase — this is the
 * minimum reliable polling strategy: re-run the page's server-side data
 * fetch on an interval. Renders nothing — drop it into any server
 * component page that should stay reasonably live without a manual refresh.
 * Mirrors apps/hotel-admin's component of the same name.
 */
export function PollingRefresh({ intervalSeconds }: { intervalSeconds: number }) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalSeconds * 1000)
    return () => clearInterval(id)
  }, [router, intervalSeconds])

  return null
}
