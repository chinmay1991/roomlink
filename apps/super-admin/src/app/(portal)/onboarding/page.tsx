import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { listOnboardingStatus, isStalled } from '@/server/services/onboarding.service'
import { Card } from '@/components/ui/card'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

export default async function OnboardingPage() {
  const rows = await listOnboardingStatus()
  const stalledCount = rows.filter(isStalled).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Onboarding</h1>
        <p className="text-sm text-slate-500">
          {rows.length} hotel{rows.length === 1 ? '' : 's'} mid-setup
          {stalledCount > 0 && <span className="text-amber-600"> · {stalledCount} stalled 48h+</span>}
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Hotel</th>
                <th className="px-5 py-3 font-medium">Progress</th>
                <th className="px-5 py-3 font-medium">Current step</th>
                <th className="px-5 py-3 font-medium">Last activity</th>
                <th className="px-5 py-3 font-medium">Implementation owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const stalled = isStalled(row)
                return (
                  <tr key={row.hotelId} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/hotels/${row.hotelId}`} className="font-medium text-slate-900 hover:text-brand-700">
                        {row.hotelName}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn('h-full rounded-full', stalled ? 'bg-amber-500' : 'bg-brand-600')}
                            style={{ width: `${row.percentComplete}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-slate-600">{row.percentComplete}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{row.currentStep ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        {stalled && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-hidden />}
                        <span className={stalled ? 'font-medium text-amber-700' : ''}>
                          {row.lastActivity ? formatDateTime(row.lastActivity) : '—'}
                        </span>
                      </div>
                      {row.daysSinceActivity !== null && (
                        <p className="text-xs text-slate-400">{row.daysSinceActivity} day{row.daysSinceActivity === 1 ? '' : 's'} ago</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{row.implementationOwner ?? 'Unassigned'}</td>
                  </tr>
                )
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                    No hotels currently mid-onboarding.
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
