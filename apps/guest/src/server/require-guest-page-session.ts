import { redirect } from 'next/navigation'
import { requireGuestSession, type GuestSessionContext } from '@/server/require-guest-session'

/**
 * Every page under app/(app)/** calls this instead of `requireGuestSession`
 * directly — same defense-in-depth reasoning as
 * apps/hotel-admin's `requireHotelPageSession`: redirect to the landing
 * page instead of throwing, and don't rely on a layout-level check alone.
 */
export async function requireGuestPageSession(): Promise<GuestSessionContext> {
  try {
    return await requireGuestSession()
  } catch {
    redirect('/session-ended')
  }
}
