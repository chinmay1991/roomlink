import { listDepartments } from '@/server/services/departments.service'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { AddDepartmentButton } from '@/components/departments/add-department-button'

export default async function HotelDepartmentsPage({ params }: { params: { hotelId: string } }) {
  const { departments, availableTemplates } = await listDepartments(params.hotelId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <AddDepartmentButton hotelId={params.hotelId} availableTemplates={availableTemplates} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Manager</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map((dept) => (
                <tr key={dept.department_id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <span className="font-medium text-slate-900">{dept.name}</span>
                    {dept.is_custom && <span className="ml-2 text-xs text-slate-400">custom</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{dept.users?.full_name ?? 'None — GM manages directly'}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={dept.is_enabled ? 'active' : 'inactive'} />
                  </td>
                </tr>
              ))}

              {departments.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-500">
                    No departments yet for this hotel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
