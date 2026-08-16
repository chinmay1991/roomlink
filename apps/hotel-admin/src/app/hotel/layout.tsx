import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { prisma } from '@/server/db'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { StaffBottomNav } from '@/components/layout/staff-bottom-nav'

export default async function HotelPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireHotelPageSession()

  const hotel = await prisma.hotels.findUnique({
    where: { hotel_id: session.user.hotelId },
    select: { name: true },
  })

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar hotelName={hotel?.name} />
        {/* pb-20 leaves room for StaffBottomNav's fixed bar on mobile; it renders null (no bar, no gap needed) for every other role */}
        <main className="flex-1 px-6 py-6 pb-20 md:pb-6">{children}</main>
      </div>
      <StaffBottomNav />
    </div>
  )
}
