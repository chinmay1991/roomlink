import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { listStaff } from '@/server/services/staff.service'
import { listDepartments } from '@/server/services/departments.service'
import { SectionTabs } from '@/components/layout/section-tabs'
import { StaffList } from './staff-list'
import { CreateStaffForm } from './create-staff-form'

export default async function StaffPage() {
  const session = await requireHotelPageSession()
  const hotelId = session.user.hotelId
  const [staff, { departments }] = await Promise.all([listStaff(hotelId), listDepartments(hotelId)])
  const enabledDepartments = departments.filter((d) => d.is_enabled)

  return (
    <div className="space-y-5">
      <SectionTabs section="people" />
      <h1 className="text-xl font-semibold text-slate-900">Staff</h1>
      <StaffList staff={staff} departments={enabledDepartments} />
      <CreateStaffForm departments={enabledDepartments} />
    </div>
  )
}
