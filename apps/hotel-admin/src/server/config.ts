import { ConfigurationError } from '@/server/errors'

/**
 * `NEXT_PUBLIC_APP_URL` on the hotel-admin Vercel project holds the GUEST
 * app's public base URL (a separate Vercel project) — this app only needs
 * it to build the URL a room's QR code should point guests at. Never call
 * `new URL(process.env.NEXT_PUBLIC_APP_URL)` directly: on Vercel a missing
 * env var is `undefined`, and `new URL(undefined)` throws `Invalid URL` at
 * request time rather than failing loudly at build/config time.
 */
export function getGuestAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!raw) {
    throw new ConfigurationError(
      'NEXT_PUBLIC_APP_URL is not set. Configure it to the guest app\'s public URL before generating QR codes.',
    )
  }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new ConfigurationError(`NEXT_PUBLIC_APP_URL is not a valid URL: "${raw}"`)
  }

  return url.origin
}
