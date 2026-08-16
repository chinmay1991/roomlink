import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { listDepartments } from '@/server/services/departments.service'
import { SectionTabs } from '@/components/layout/section-tabs'
import { DepartmentList } from './department-list'
import { EnableDepartment } from './enable-department'

export default async function DepartmentsPage() {
  const session = await requireHotelPageSession()
  const { departments, availableTemplates } = await listDepartments(session.user.hotelId)

  return (
    <div className="space-y-5">
      <SectionTabs section="hotel" />
      <h1 className="text-xl font-semibold text-slate-900">Departments</h1>
      <DepartmentList departments={departments} />
      <EnableDepartment availableTemplates={availableTemplates} />
    </div>
  )
}
