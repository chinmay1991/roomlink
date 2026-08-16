import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { listServices } from '@/server/services/guest-services.service'
import { listDepartments } from '@/server/services/departments.service'
import { SectionTabs } from '@/components/layout/section-tabs'
import { ServiceList } from './service-list'
import { AddService } from './add-service'

export default async function ServicesPage() {
  const session = await requireHotelPageSession()
  const hotelId = session.user.hotelId
  const [services, { departments }] = await Promise.all([listServices(hotelId), listDepartments(hotelId)])
  const enabledDepartments = departments.filter((d) => d.is_enabled)

  return (
    <div className="space-y-5">
      <SectionTabs section="guest-services" />
      <h1 className="text-xl font-semibold text-slate-900">Guest Services</h1>
      <ServiceList services={services} />
      <AddService departments={enabledDepartments} existingNames={services.map((s) => s.name)} />
    </div>
  )
}
