import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { listDepartments } from '@/server/services/departments.service'
import { listStaff } from '@/server/services/staff.service'
import { SectionTabs } from '@/components/layout/section-tabs'
import { ManagerAssignment } from './manager-assignment'

export default async function ManagersPage() {
  const session = await requireHotelPageSession()
  const hotelId = session.user.hotelId
  const [{ departments }, staff] = await Promise.all([listDepartments(hotelId), listStaff(hotelId)])
  const enabledDepartments = departments.filter((d) => d.is_enabled)
  const staffOptions = staff.filter((s) => s.status === 'active').map((s) => ({ user_id: s.user_id, full_name: s.full_name }))

  return (
    <div className="space-y-5">
      <SectionTabs section="people" />
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Department Managers</h1>
        <p className="text-sm text-slate-500">
          Optional per department — leave unassigned and the GM manages the department directly.
        </p>
      </div>
      <ManagerAssignment departments={enabledDepartments} staff={staffOptions} />
    </div>
  )
}
