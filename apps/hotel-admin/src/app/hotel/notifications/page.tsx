import Link from 'next/link'
import { AlertTriangle, OctagonAlert } from 'lucide-react'
import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { getHotelAlerts, getDepartmentAlerts, getStaffAlerts } from '@/server/services/alerts.service'
import { getManagerDepartmentIds, getStaffDepartmentIds } from '@/server/services/requests.service'
import { SectionTabs } from '@/components/layout/section-tabs'
import { Card } from '@roomlink/ui'
import type { HotelSessionUser } from '@/server/require-hotel-session'

export default async function NotificationsPage() {
  const session = await requireHotelPageSession()
  const actor = session.user as HotelSessionUser
  const isDepartmentManager = actor.roleName === 'Department Manager'
  const isDepartmentStaff = actor.roleName === 'Department Staff'

  const alerts = isDepartmentManager
    ? await getDepartmentAlerts(session.user.hotelId, await getManagerDepartmentIds(session.user.hotelId, actor.id))
    : isDepartmentStaff
      ? await getStaffAlerts(session.user.hotelId, await getStaffDepartmentIds(session.user.hotelId, actor.id))
      : await getHotelAlerts(session.user.hotelId)

  return (
    <div className="space-y-5">
      {!isDepartmentManager && !isDepartmentStaff && <SectionTabs section="operations" />}
      <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {alerts.map((a) => (
            <li key={a.id}>
              <Link href={a.href} className="flex items-center gap-2.5 px-5 py-3.5 text-sm hover:bg-slate-50">
                {a.severity === 'critical' ? (
                  <OctagonAlert className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                )}
                <span className="text-slate-800">{a.message}</span>
              </Link>
            </li>
          ))}
          {alerts.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-slate-500">All clear — no alerts right now.</li>
          )}
        </ul>
      </Card>
    </div>
  )
}
