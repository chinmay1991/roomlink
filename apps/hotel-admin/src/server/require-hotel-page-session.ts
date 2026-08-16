import { redirect } from 'next/navigation'
import { getServerSession, type Session } from 'next-auth'
import { authOptions } from '@/server/auth'

type HotelPageSession = Session & { user: Session['user'] & { hotelId: string } }

/**
 * Every server-component page under app/hotel/** calls this instead of
 * getServerSession directly. app/hotel/layout.tsx already redirects
 * unauthenticated requests, but relying on that alone left every page
 * crashing with an unhandled "Cannot read properties of null" whenever a
 * page's own getServerSession call raced ahead of (or otherwise disagreed
 * with) the layout's — e.g. across a dev-server restart mid-session. This
 * makes every page defend itself the same way APIs already do via
 * requireHotelSession, instead of trusting the layout alone.
 */
export async function requireHotelPageSession(): Promise<HotelPageSession> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.hotelId) {
    redirect('/login')
  }
  return session as HotelPageSession
}
