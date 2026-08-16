import { getHotelAuditTrail } from '@/server/services/hotels.service'
import { AuditLogList } from '@/components/hotels/audit-log-list'

export default async function HotelAuditPage({ params }: { params: { hotelId: string } }) {
  const entries = await getHotelAuditTrail(params.hotelId)
  return (
    <AuditLogList
      entries={entries}
      emptyMessage="No audited actions yet across this hotel, its subscriptions, or its users."
    />
  )
}
