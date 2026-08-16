import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { extendTrialSchema } from '@/server/validation/subscription.schema'
import { extendSubscriptionTrial } from '@/server/services/subscriptions.service'

export async function POST(req: NextRequest, { params }: { params: { subscriptionId: string } }) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'subscriptions', 'edit')

    const { days } = extendTrialSchema.parse(await req.json())
    const updated = await extendSubscriptionTrial(params.subscriptionId, days, user)

    return NextResponse.json({ subscriptionId: updated.subscription_id, trialEndDate: updated.trial_end_date })
  } catch (error) {
    return toErrorResponse(error)
  }
}
