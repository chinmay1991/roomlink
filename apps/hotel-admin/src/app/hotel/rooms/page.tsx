import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { listRooms } from '@/server/services/rooms.service'
import { SectionTabs } from '@/components/layout/section-tabs'
import { RoomList } from './room-list'
import { CreateRoomForm } from './create-room-form'
import { BulkImport } from './bulk-import'

export default async function RoomsPage() {
  const session = await requireHotelPageSession()
  const rooms = await listRooms(session.user.hotelId, {})

  return (
    <div className="space-y-5">
      <SectionTabs section="hotel" />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Rooms</h1>
        <p className="text-sm text-slate-500">{rooms.length} total</p>
      </div>
      <RoomList rooms={rooms} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CreateRoomForm />
        <BulkImport />
      </div>
    </div>
  )
}
