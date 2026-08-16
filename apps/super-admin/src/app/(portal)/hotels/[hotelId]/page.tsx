import { redirect } from 'next/navigation'

export default function HotelDetailIndex({ params }: { params: { hotelId: string } }) {
  redirect(`/hotels/${params.hotelId}/overview`)
}
