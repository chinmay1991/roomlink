import { headers } from 'next/headers'

/**
 * Appended to the WebView's User-Agent via the Capacitor shell's
 * ios/android `appendUserAgent` config (Milestone 2) — never present on any
 * request from a real browser, so this is false for 100% of existing web
 * traffic, including the existing PWA install. This is the one flag the
 * mobile-app plan's "Isolation mechanism" gates every native-only branch on.
 */
const NATIVE_UA_MARKER = 'RoomLinkNativeApp'

/**
 * True only inside the native app's WebView. Server components use this
 * (instead of a client-side Capacitor.isNativePlatform() check) so the
 * decision is made once, server-side, with no hydration flash and no risk
 * of ever evaluating true for a browser request.
 */
export function isNativeClient(): boolean {
  const ua = headers().get('user-agent') ?? ''
  if (ua.includes(NATIVE_UA_MARKER)) return true

  // Local-only escape hatch so the native chrome can be built, reviewed, and
  // tested before the Capacitor shell (Milestone 2) exists to send the real
  // UA marker. Never true in production.
  return process.env.NODE_ENV !== 'production' && process.env.FORCE_NATIVE_SHELL === '1'
}
