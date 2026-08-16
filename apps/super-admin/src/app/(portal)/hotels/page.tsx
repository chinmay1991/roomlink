import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listHotels } from '@/server/services/hotels.service'
import { hotelListFiltersSchema } from '@/server/validation/hotel.schema'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Pagination } from '@/components/ui/pagination'
import { HotelFilterBar } from '@/components/hotels/filter-bar'
import { HotelRowActions } from '@/components/hotels/hotel-row-actions'

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>
}) {
  const filters = hotelListFiltersSchema.parse(searchParams)
  const { items, total, page, totalPages, plans } = await listHotels(filters)

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.status) params.set('status', filters.status)
    if (filters.planId) params.set('planId', filters.planId)
    if (targetPage > 1) params.set('page', String(targetPage))
    const qs = params.toString()
    return qs ? `/hotels?${qs}` : '/hotels'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Hotels</h1>
          <p className="text-sm text-slate-500">{total} hotel workspace{total === 1 ? '' : 's'} on the platform.</p>
        </div>
        <Link href="/hotels/new">
          <Button>
            <Plus className="h-4 w-4" aria-hidden />
            Create hotel
          </Button>
        </Link>
      </div>

      <HotelFilterBar plans={plans} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Hotel</th>
                <th className="px-5 py-3 font-medium">City</th>
                <th className="px-5 py-3 font-medium">Rooms</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((hotel) => (
                <tr key={hotel.hotel_id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{hotel.name}</p>
                    <p className="text-xs text-slate-500">{hotel.hotel_code}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{hotel.city ?? '—'}</td>
                  <td className="px-5 py-3 tabular-nums text-slate-600">{hotel._count.rooms}</td>
                  <td className="px-5 py-3 text-slate-600">{hotel.subscription_plans?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={hotel.status} />
                  </td>
                  <td className="px-5 py-3">
                    <HotelRowActions hotelId={hotel.hotel_id} />
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                    No hotels match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
      </Card>
    </div>
  )
}
