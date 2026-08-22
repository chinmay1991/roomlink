import { notFound } from 'next/navigation'
import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { getQrCodeForRoom } from '@/server/services/qr-codes.service'
import { getHotelProfile } from '@/server/services/hotel-profile.service'
import { listDepartments } from '@/server/services/departments.service'
import { RoomQrCard } from './room-qr-card'
import { departmentDisplay } from './department-display'

export default async function QrCardPage({ params }: { params: { qrCodeId: string } }) {
  const session = await requireHotelPageSession()

  const qr = await getQrCodeForRoom(session.user.hotelId, params.qrCodeId).catch(() => null)
  if (!qr || !qr.is_active) notFound()

  const [hotel, { departments }] = await Promise.all([
    getHotelProfile(session.user.hotelId),
    listDepartments(session.user.hotelId),
  ])

  const services = departments.filter((d) => d.is_enabled).map((d) => departmentDisplay(d.name))

  return (
    <RoomQrCard
      hotelName={hotel.name}
      roomNumber={qr.rooms.room_number}
      qrImageSrc={`/api/v1/hotel/qr-codes/code/${qr.qr_code_id}/image`}
      services={services}
    />
  )
}
