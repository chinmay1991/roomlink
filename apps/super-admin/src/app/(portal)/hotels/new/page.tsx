import { prisma } from '@/server/db'
import { HotelWizard } from '@/components/hotels/wizard/hotel-wizard'

export default async function NewHotelPage() {
  const plans = await prisma.subscription_plans.findMany({
    where: { is_active: true },
    orderBy: { price_amount: 'asc' },
    select: { plan_id: true, name: true, price_amount: true, billing_cycle: true, room_limit: true, staff_limit: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Create a hotel</h1>
        <p className="text-sm text-slate-500">Sets up the workspace, Hotel Admin, onboarding tracker, and trial subscription.</p>
      </div>

      <HotelWizard plans={plans.map((p) => ({ ...p, price_amount: p.price_amount.toString() }))} />
    </div>
  )
}
