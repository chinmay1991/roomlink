import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { StaffBottomNav } from '@/components/layout/staff-bottom-nav'

export default async function HotelPortalLayout({ children }: { children: React.ReactNode }) {
  // hotelName comes off the session (set at login), not a fresh DB lookup —
  // this layout re-runs on every navigation and every PollingRefresh tick
  // (router.refresh() re-renders the whole route tree, layout included), so
  // a query here was firing every 15-20s per open tab for a value that's
  // static for the life of the session (same tradeoff already made for
  // hotelId/roleName/userType elsewhere in the JWT).
  const session = await requireHotelPageSession()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar hotelName={session.user.hotelName} />
        {/* pb-20 leaves room for StaffBottomNav's fixed bar on mobile; it renders null (no bar, no gap needed) for every other role */}
        <main className="flex-1 px-6 py-6 pb-20 md:pb-6">{children}</main>
      </div>
      <StaffBottomNav />
    </div>
  )
}
