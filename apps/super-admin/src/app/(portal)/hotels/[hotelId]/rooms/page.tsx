import { getHotelRooms } from '@/server/services/hotels.service'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'

export default async function HotelRoomsPage({ params }: { params: { hotelId: string } }) {
  const { total, byStatus, byType } = await getHotelRooms(params.hotelId)

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">By status</h2>
        </CardHeader>
        <CardBody className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900">Total rooms</span>
            <span className="tabular-nums text-slate-900">{total}</span>
          </div>
          {byStatus.map((row) => (
            <div key={row.status} className="flex items-center justify-between text-sm">
              <StatusBadge status={row.status} />
              <span className="tabular-nums text-slate-600">{row.count}</span>
            </div>
          ))}
          {byStatus.length === 0 && <p className="text-sm text-slate-500">No rooms added yet.</p>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">By room type</h2>
        </CardHeader>
        <CardBody className="space-y-2.5">
          {byType.map((row) => (
            <div key={row.name} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{row.name}</span>
              <span className="tabular-nums text-slate-600">{row.count}</span>
            </div>
          ))}
          {byType.length === 0 && <p className="text-sm text-slate-500">No rooms added yet.</p>}
        </CardBody>
      </Card>

      <div className="sm:col-span-2 rounded-md border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
        Room-level management (add/edit individual rooms, QR codes) is done inside the Hotel Admin workspace, not here — Super Admin gets read-only oversight.
      </div>
    </div>
  )
}
