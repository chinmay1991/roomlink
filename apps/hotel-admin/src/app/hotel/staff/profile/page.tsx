import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { getOwnStaffProfile } from '@/server/services/staff.service'
import { Card, StatusBadge } from '@roomlink/ui'
import { SignOutButton } from './sign-out-button'
import type { HotelSessionUser } from '@/server/require-hotel-session'

/** Staff PRD §18 — read-only. Role/hotel/department permissions are Hotel Admin-only, not shown as editable here. */
export default async function StaffProfilePage() {
  const session = await requireHotelPageSession()
  const hotelId = session.user.hotelId
  const actor = session.user as HotelSessionUser

  const profile = await getOwnStaffProfile(hotelId, actor.id)

  const fields: { label: string; value: string }[] = [
    { label: 'Name', value: profile.full_name },
    { label: 'Employee ID', value: profile.employee_id ?? '—' },
    { label: 'Mobile', value: profile.phone ?? '—' },
    { label: 'Email', value: profile.email },
  ]

  return (
    <div className="space-y-5 pb-4">
      <h1 className="text-xl font-semibold text-slate-900">Profile</h1>

      <Card className="divide-y divide-slate-100">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center justify-between px-5 py-3.5">
            <span className="text-sm text-slate-500">{f.label}</span>
            <span className="text-sm font-medium text-slate-900">{f.value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-5 py-3.5">
          <span className="text-sm text-slate-500">Account status</span>
          <StatusBadge status={profile.status} />
        </div>
      </Card>

      <Card>
        <div className="px-5 py-4">
          <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-slate-400">My departments</p>
          <div className="flex flex-wrap gap-2">
            {profile.user_departments.map((ud) => (
              <span
                key={ud.department_id}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-slate-600"
              >
                {ud.departments.name}
              </span>
            ))}
            {profile.user_departments.length === 0 && <span className="text-sm text-slate-500">No departments assigned yet.</span>}
          </div>
        </div>
      </Card>

      <SignOutButton />
    </div>
  )
}
