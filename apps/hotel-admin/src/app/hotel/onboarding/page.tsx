import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'
import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { getHotelProfile } from '@/server/services/hotel-profile.service'
import { listOnboardingSteps } from '@/server/services/hotel-onboarding.service'
import { Card, cn } from '@roomlink/ui'
import { GoLiveButton } from './go-live-button'

const STEP_HREF: Record<string, string> = {
  'Hotel Profile': '/hotel/profile',
  'Legal & GST': '/hotel/legal',
  Departments: '/hotel/departments',
  Rooms: '/hotel/rooms',
  'QR Codes': '/hotel/qr-codes',
  Staff: '/hotel/staff',
  'Department Managers': '/hotel/managers',
  'Guest Services': '/hotel/services',
  'Restaurant Menu': '/hotel/menu',
  'Notifications & Settings': '/hotel/settings',
  Review: '/hotel/onboarding',
}

export default async function OnboardingPage() {
  const session = await requireHotelPageSession()
  const hotelId = session.user.hotelId
  const [hotel, steps] = await Promise.all([getHotelProfile(hotelId), listOnboardingSteps(hotelId)])

  const total = steps.length
  const completed = steps.filter((s) => s.status === 'complete').length
  const percent = total ? Math.round((completed / total) * 100) : 0
  const isLive = hotel.status !== 'pending' && hotel.status !== 'onboarding'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Onboarding</h1>
          <p className="text-sm text-slate-500">
            {isLive ? 'This hotel is live.' : `${percent}% complete — save & continue anytime.`}
          </p>
        </div>
        {!isLive && <GoLiveButton disabled={false} />}
      </div>

      <Card className="overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {steps.map((step) => (
            <li key={step.tracker_id}>
              <Link
                href={STEP_HREF[step.step_name] ?? '/hotel/dashboard'}
                className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2.5 text-sm text-slate-800">
                  {step.status === 'complete' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-300" aria-hidden />
                  )}
                  {step.step_name}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium capitalize',
                    step.status === 'complete' ? 'text-emerald-600' : 'text-slate-400'
                  )}
                >
                  {step.status.replace('_', ' ')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
