import { getHotelActivity } from '@/server/services/hotels.service'
import { AuditLogList } from '@/components/hotels/audit-log-list'

export default async function HotelActivityPage({ params }: { params: { hotelId: string } }) {
  const entries = await getHotelActivity(params.hotelId)
  return (
    <AuditLogList
      entries={entries}
      emptyMessage="No hotel-level milestones recorded yet (created, admin invited, subscription changed…)."
    />
  )
}
