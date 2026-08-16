import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { listRequests } from '@/server/services/requests.service'
import { listDepartments } from '@/server/services/departments.service'
import { listRooms } from '@/server/services/rooms.service'
import { SectionTabs } from '@/components/layout/section-tabs'
import { RequestsBoard } from './requests-board'
import type { HotelSessionUser } from '@/server/require-hotel-session'

export default async function RequestsPage() {
  const session = await requireHotelPageSession()
  const hotelId = session.user.hotelId
  const actor = session.user as HotelSessionUser
  const [requests, { departments }, rooms] = await Promise.all([
    listRequests(hotelId, {}, actor),
    listDepartments(hotelId),
    listRooms(hotelId, {}),
  ])

  return (
    <div className="space-y-5">
      <SectionTabs section="guest-services" />
      <h1 className="text-xl font-semibold text-slate-900">Requests</h1>
      <RequestsBoard
        requests={requests.map((r) => ({
          request_id: r.request_id,
          request_type: r.request_type,
          status: r.status,
          priority: r.priority,
          notes: r.notes,
          created_at: r.created_at.toISOString(),
          rooms: r.rooms,
          guests: r.guests,
          departments: r.departments,
          users: r.users,
        }))}
        departments={departments.filter((d) => d.is_enabled)}
        rooms={rooms.filter((r) => r.status === 'active').map((r) => ({ room_id: r.room_id, room_number: r.room_number }))}
      />
    </div>
  )
}
