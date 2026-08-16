'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChangePlanModal, PlanOption } from './change-plan-modal'
import { ExtendTrialModal } from './extend-trial-modal'

export function SubscriptionActions({
  subscriptionId,
  status,
  autoRenew,
  planId,
  plans,
}: {
  subscriptionId: string
  status: string
  autoRenew: boolean
  planId: string
  plans: PlanOption[]
}) {
  const router = useRouter()
  const [modal, setModal] = useState<'plan' | 'trial' | null>(null)
  const [pending, setPending] = useState<string | null>(null)

  async function post(action: string) {
    setPending(action)
    await fetch(`/api/v1/subscriptions/${subscriptionId}/${action}`, { method: 'POST' })
    setPending(null)
    router.refresh()
  }

  const isTerminal = status === 'cancelled' || status === 'expired'

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
      {!isTerminal && (
        <button className="font-medium text-brand-600 hover:text-brand-700" onClick={() => setModal('plan')}>
          Change plan
        </button>
      )}
      {status === 'trial' && (
        <button className="text-slate-500 hover:text-slate-800" onClick={() => setModal('trial')}>
          Extend trial
        </button>
      )}
      {status === 'trial' && (
        <button className="text-slate-500 hover:text-slate-800 disabled:opacity-50" disabled={!!pending} onClick={() => post('activate')}>
          {pending === 'activate' ? 'Activating…' : 'Activate'}
        </button>
      )}
      {status === 'active' && (
        <button className="text-slate-500 hover:text-slate-800 disabled:opacity-50" disabled={!!pending} onClick={() => post('pause')}>
          {pending === 'pause' ? 'Pausing…' : 'Pause'}
        </button>
      )}
      {status === 'paused' && (
        <button className="text-slate-500 hover:text-slate-800 disabled:opacity-50" disabled={!!pending} onClick={() => post('resume')}>
          {pending === 'resume' ? 'Resuming…' : 'Resume'}
        </button>
      )}
      {!isTerminal && (
        <button className="text-slate-500 hover:text-slate-800 disabled:opacity-50" disabled={!!pending} onClick={() => post('toggle-auto-renew')}>
          {pending === 'toggle-auto-renew' ? 'Saving…' : autoRenew ? 'Disable auto-renew' : 'Enable auto-renew'}
        </button>
      )}
      {!isTerminal && (
        <button className="text-red-600 hover:text-red-700 disabled:opacity-50" disabled={!!pending} onClick={() => post('cancel')}>
          {pending === 'cancel' ? 'Cancelling…' : 'Cancel'}
        </button>
      )}

      {modal === 'plan' && (
        <ChangePlanModal subscriptionId={subscriptionId} plans={plans} currentPlanId={planId} onClose={() => setModal(null)} />
      )}
      {modal === 'trial' && <ExtendTrialModal subscriptionId={subscriptionId} onClose={() => setModal(null)} />}
    </div>
  )
}
