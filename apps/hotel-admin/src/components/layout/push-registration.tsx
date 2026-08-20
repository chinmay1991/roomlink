'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

/**
 * Mounted once inside MobileShell (native app only). Capacitor.isNativePlatform()
 * is false in every browser — including this app's existing PWA install —
 * so this is a defense-in-depth no-op there even though MobileShell itself
 * already only renders natively. The server can't reach out and ask for a
 * token, so the client volunteers its own on every app load while signed in.
 *
 * Also gated on NEXT_PUBLIC_PUSH_ENABLED, separately from the native check:
 * PushNotifications.register()'s native Android implementation calls
 * FirebaseMessaging.getInstance() directly, which throws on a background
 * thread no JS try/catch can reach if no Firebase project is configured —
 * confirmed to hard-crash the whole app, not just reject a promise. Flip
 * this on only once google-services.json (Android) and an APNs key (iOS)
 * actually exist.
 */
export function PushRegistration() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    if (process.env.NEXT_PUBLIC_PUSH_ENABLED !== '1') return

    let cancelled = false

    const registrationListener = PushNotifications.addListener('registration', async (token) => {
      if (cancelled) return
      await fetch('/api/v1/hotel/device-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.value, platform: Capacitor.getPlatform() }),
      }).catch((error) => console.error('[push] failed to register device token', error))
    })

    const errorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('[push] registration failed', error)
    })

    PushNotifications.requestPermissions()
      .then((perm) => {
        if (!cancelled && perm.receive === 'granted') return PushNotifications.register()
      })
      .catch((error) => console.error('[push] permission request failed', error))

    return () => {
      cancelled = true
      registrationListener.then((h) => h.remove())
      errorListener.then((h) => h.remove())
    }
  }, [])

  return null
}
