import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { changePlanSchema } from '@/server/validation/subscription.schema'
import { changeSubscriptionPlan } from '@/server/services/subscriptions.service'

export async function POST(req: NextRequest, { params }: { params: { subscriptionId: string } }) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'subscriptions', 'edit')

    const { planId } = changePlanSchema.parse(await req.json())
    const updated = await changeSubscriptionPlan(params.subscriptionId, planId, user)

    return NextResponse.json({ subscriptionId: updated.subscription_id, planId: updated.plan_id })
  } catch (error) {
    return toErrorResponse(error)
  }
}
