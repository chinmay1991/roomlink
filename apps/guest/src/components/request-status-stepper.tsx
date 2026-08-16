import { Check, Circle } from 'lucide-react'
import { toGuestRequestStatus } from '@/lib/guest-status'

const STEPS: { status: 'pending' | 'assigned' | 'in_progress' | 'completed'; label: string }[] = [
  { status: 'pending', label: 'Request Received' },
  { status: 'assigned', label: 'Assigned' },
  { status: 'in_progress', label: 'Being Prepared' },
  { status: 'completed', label: 'Completed' },
]

/** Guest PRD §13 — the ✓/●/○ progress stepper. Cancelled is shown separately, not on this track. */
export function RequestStatusStepper({ status }: { status: string }) {
  const guestStatus = toGuestRequestStatus(status)

  if (guestStatus === 'cancelled') {
    return <p className="text-sm font-medium text-red-600">Cancelled</p>
  }

  const currentIndex = STEPS.findIndex((s) => s.status === guestStatus)

  return (
    <ul className="space-y-1.5">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex
        const isCurrent = i === currentIndex
        return (
          <li key={step.status} className="flex items-center gap-2 text-sm">
            {done ? (
              <Check className={isCurrent ? 'h-4 w-4 text-brand-600' : 'h-4 w-4 text-emerald-600'} aria-hidden />
            ) : (
              <Circle className="h-4 w-4 text-slate-300" aria-hidden />
            )}
            <span className={done ? 'font-medium text-slate-800' : 'text-slate-400'}>{step.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
