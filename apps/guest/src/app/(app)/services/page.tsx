import { requireGuestPageSession } from '@/server/require-guest-page-session'
import { listEnabledServices } from '@/server/services/services.service'
import { ServicePicker } from './service-picker'

export default async function ServicesPage() {
  const ctx = await requireGuestPageSession()
  const groups = await listEnabledServices(ctx.hotelId)

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-900">Request Service</h1>
      <ServicePicker groups={groups} />
    </div>
  )
}
