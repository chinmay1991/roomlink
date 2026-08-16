import { useFormContext } from 'react-hook-form'
import { CreateHotelInput } from '@/server/validation/hotel.schema'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { WizardField } from './field'

export type PlanOption = {
  plan_id: string
  name: string
  price_amount: string
  billing_cycle: string
  room_limit: number | null
  staff_limit: number | null
}

export function StepPlan({ plans }: { plans: PlanOption[] }) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<CreateHotelInput>()
  const selected = watch('planId')

  return (
    <div className="space-y-4">
      <div>
        <Label>Subscription plan</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {plans.map((plan) => (
            <label
              key={plan.plan_id}
              className={cn(
                'cursor-pointer rounded-lg border p-4 transition-colors',
                selected === plan.plan_id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <input type="radio" value={plan.plan_id} className="sr-only" {...register('planId')} />
              <p className="font-medium text-slate-900">{plan.name}</p>
              <p className="text-sm text-slate-500">
                {formatCurrency(plan.price_amount)} / {plan.billing_cycle}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {plan.room_limit ? `Up to ${plan.room_limit} rooms` : 'Unlimited rooms'} ·{' '}
                {plan.staff_limit ? `${plan.staff_limit} staff` : 'Unlimited staff'}
              </p>
            </label>
          ))}
        </div>
        {errors.planId && <p className="mt-1 text-sm text-red-600">{errors.planId.message as string}</p>}
      </div>

      <div className="max-w-xs">
        <WizardField name="trialDays" label="Trial length (days)" type="number" valueAsNumber />
      </div>
    </div>
  )
}
