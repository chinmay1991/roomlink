import { requireHotelPageSession } from '@/server/require-hotel-page-session'

/**
 * Deliberately bare — no Sidebar/Topbar. Pages under this route group are
 * printable artifacts (e.g. the room QR card) meant to fill the page at an
 * exact physical size, not sit inside the dashboard chrome.
 */
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireHotelPageSession()
  return <>{children}</>
}
