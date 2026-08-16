import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { getManagerDepartmentIds } from '@/server/services/requests.service'
import { getManagerTeam } from '@/server/services/departments.service'
import { Card, CardBody, StatusBadge } from '@roomlink/ui'
import type { HotelSessionUser } from '@/server/require-hotel-session'

/** PRD §5/§10: eligible staff + current workload across the manager's own department(s). */
export default async function ManagerTeamPage() {
  const session = await requireHotelPageSession()
  const hotelId = session.user.hotelId
  const actor = session.user as HotelSessionUser

  const departmentIds = await getManagerDepartmentIds(hotelId, actor.id)

  if (departmentIds.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Team</h1>
        <Card>
          <CardBody className="py-10 text-center text-sm text-slate-500">
            You are not currently assigned as the manager of any department.
          </CardBody>
        </Card>
      </div>
    )
  }

  const team = await getManagerTeam(hotelId, departmentIds)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Team</h1>
        <p className="mt-1 text-sm text-slate-500">
          Eligible staff for {team.departments.map((d) => d.name).join(', ')} — including anyone who also belongs to
          another department (PRD §5: multi-department staff are not restricted to one team).
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Departments</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Active workload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {team.members.map((m) => (
                <tr key={m.user_id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{m.full_name}</p>
                    <p className="text-xs text-slate-500">{m.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {m.departments.map((d) => (
                        <span key={d.department_id} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {d.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-5 py-3 tabular-nums text-slate-600">{m.activeWorkload}</td>
                </tr>
              ))}
              {team.members.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">
                    No staff assigned to this department yet.
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
