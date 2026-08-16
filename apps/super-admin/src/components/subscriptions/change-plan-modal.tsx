'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/format'

export type PlanOption = { plan_id: string; name: string; price_amount: string; billing_cycle: string }

export function ChangePlanModal({
  subscriptionId,
  plans,
  currentPlanId,
  onClose,
}: {
  subscriptionId: string
  plans: PlanOption[]
  currentPlanId: string
  onClose: () => void
}) {
  const router = useRouter()
  const [planId, setPlanId] = useState(currentPlanId)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    setSubmitting(true)
    setError(null)
    const res = await fetch(`/api/v1/subscriptions/${subscriptionId}/change-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not change plan.')
      setSubmitting(false)
      return
    }
    onClose()
    router.refresh()
  }

  return (
    <Modal title="Change plan" onClose={onClose}>
      <div className="space-y-3">
        <Label>Subscription plan</Label>
        {plans.map((plan) => (
          <label key={plan.plan_id} className="flex cursor-pointer items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm hover:border-slate-300">
            <span>
              <input
                type="radio"
                name="plan"
                className="mr-2"
                checked={planId === plan.plan_id}
                onChange={() => setPlanId(plan.plan_id)}
              />
              {plan.name}
            </span>
            <span className="text-slate-500">
              {formatCurrency(plan.price_amount)}/{plan.billing_cycle}
            </span>
          </label>
        ))}

        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting || planId === currentPlanId}>
            {submitting ? 'Saving…' : 'Change plan'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
