import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getHotelHeader } from '@/server/services/hotels.service'
import { StatusBadge } from '@/components/ui/status-badge'
import { HotelTabNav } from '@/components/hotels/hotel-tab-nav'
import { ImpersonateButton } from '@/components/hotels/impersonate-button'

export default async function HotelDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { hotelId: string }
}) {
  const hotel = await getHotelHeader(params.hotelId)
  if (!hotel) notFound()

  return (
    <div className="space-y-5">
      <Link href="/hotels" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to Hotels
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-slate-900">{hotel.name}</h1>
            <StatusBadge status={hotel.status} />
          </div>
          <p className="text-sm text-slate-500">
            {hotel.hotel_code} · {hotel.city ?? 'No city set'} · {hotel.subscription_plans?.name ?? 'No plan'}
          </p>
        </div>
        <ImpersonateButton hotelId={params.hotelId} />
      </div>

      <HotelTabNav hotelId={params.hotelId} />

      {children}
    </div>
  )
}
