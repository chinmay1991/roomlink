import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { toggleAutoRenew } from '@/server/services/subscriptions.service'

export async function POST(req: NextRequest, { params }: { params: { subscriptionId: string } }) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'subscriptions', 'edit')
    const updated = await toggleAutoRenew(params.subscriptionId, user)
    return NextResponse.json({ autoRenew: updated.auto_renew })
  } catch (error) {
    return toErrorResponse(error)
  }
}
