import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { requireCan } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { addIntegrationSchema } from '@/server/validation/integration.schema'
import { addIntegration } from '@/server/services/integrations.service'

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req)
    await requireCan(user, 'integrations', 'create')

    const body = addIntegrationSchema.parse(await req.json())
    const integration = await addIntegration(body, user)

    return NextResponse.json({ integrationId: integration.integration_id }, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
