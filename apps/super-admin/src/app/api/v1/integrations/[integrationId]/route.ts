import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { removeIntegration } from '@/server/services/integrations.service'

export async function DELETE(req: NextRequest, { params }: { params: { integrationId: string } }) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'integrations', 'delete')
    await removeIntegration(params.integrationId, user)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}
