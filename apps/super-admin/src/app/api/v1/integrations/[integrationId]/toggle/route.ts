import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { toggleIntegration } from '@/server/services/integrations.service'

export async function POST(req: NextRequest, { params }: { params: { integrationId: string } }) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'integrations', 'edit')
    const updated = await toggleIntegration(params.integrationId, user)
    return NextResponse.json({ isActive: updated.is_active })
  } catch (error) {
    return toErrorResponse(error)
  }
}
