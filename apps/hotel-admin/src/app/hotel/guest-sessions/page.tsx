import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { listGuestSessions } from '@/server/services/guest-sessions.service'
import { listRooms } from '@/server/services/rooms.service'
import { SectionTabs } from '@/components/layout/section-tabs'
import { GuestSessionsPanel } from './guest-sessions-panel'

export default async function GuestSessionsPage() {
  const session = await requireHotelPageSession()
  const hotelId = session.user.hotelId
  const [sessions, rooms] = await Promise.all([listGuestSessions(hotelId), listRooms(hotelId, {})])

  return (
    <div className="space-y-5">
      <SectionTabs section="operations" />
      <h1 className="text-xl font-semibold text-slate-900">Active Stays</h1>
      <GuestSessionsPanel
        sessions={sessions.map((s) => ({
          session_id: s.session_id,
          status: s.status,
          guest_mobile_e164: s.guest_mobile_e164,
          issued_at: s.issued_at.toISOString(),
          expires_at: s.expires_at.toISOString(),
          rooms: s.rooms,
          guests: s.guests,
        }))}
        rooms={rooms.filter((r) => r.status === 'active').map((r) => ({ room_id: r.room_id, room_number: r.room_number }))}
      />
    </div>
  )
}
