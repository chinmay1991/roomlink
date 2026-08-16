import { requireGuestPageSession } from '@/server/require-guest-page-session'
import { getHotelInfo } from '@/server/services/hotel-info.service'
import { Card } from '@roomlink/ui'

function formatTime(t: Date | string | null) {
  if (!t) return null
  const d = typeof t === 'string' ? new Date(`1970-01-01T${t}`) : t
  return new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(d)
}

/** Guest PRD §21 — entirely from Hotel Admin's own configuration, no hard-coded fields. */
export default async function HotelInfoPage() {
  const ctx = await requireGuestPageSession()
  const hotel = await getHotelInfo(ctx.hotelId)

  const address = [hotel.address_line, hotel.city, hotel.state, hotel.pincode, hotel.country].filter(Boolean).join(', ')

  const rows: { label: string; value: string | null }[] = [
    { label: 'Address', value: address || null },
    { label: 'Phone', value: hotel.phone },
    { label: 'Email', value: hotel.email },
    { label: 'Check-in', value: formatTime(hotel.check_in_time) },
    { label: 'Check-out', value: formatTime(hotel.check_out_time) },
    { label: 'Breakfast', value: formatTime(hotel.breakfast_time) },
    { label: 'Restaurant hours', value: formatTime(hotel.restaurant_time) },
    { label: 'Wi-Fi network', value: hotel.hotel_settings?.wifi_name ?? null },
    { label: 'Wi-Fi password', value: hotel.hotel_settings?.wifi_password ?? null },
  ].filter((r) => r.value)

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-900">{hotel.name}</h1>

      {hotel.hotel_settings?.welcome_message && <p className="text-sm text-slate-600">{hotel.hotel_settings.welcome_message}</p>}

      <Card className="divide-y divide-slate-100">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-slate-500">{r.label}</span>
            <span className="text-right text-sm font-medium text-slate-900">{r.value}</span>
          </div>
        ))}
      </Card>

      {hotel.hotel_settings?.guest_instructions && (
        <Card className="p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Instructions</p>
          <p className="text-sm text-slate-700">{hotel.hotel_settings.guest_instructions}</p>
        </Card>
      )}
    </div>
  )
}
