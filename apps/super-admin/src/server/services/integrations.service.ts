import { integration_type } from '@prisma/client'
import { prisma } from '@/server/db'
import { recordAudit } from '@/server/audit'
import type { SessionUser } from '@/server/rbac'

/** Platform-level rows only (hotel_id IS NULL) — see script.sql Section 9. */
export async function listIntegrations() {
  return prisma.integrations.findMany({ where: { hotel_id: null }, orderBy: { created_at: 'asc' } })
}

export async function addIntegration(
  data: { integrationType: integration_type; provider: string; notes?: string },
  actor: SessionUser
) {
  const integration = await prisma.integrations.create({
    data: {
      hotel_id: null,
      integration_type: data.integrationType,
      provider: data.provider,
      // Non-secret metadata only — real credentials live in env vars / a secrets manager, never here.
      config: data.notes ? { notes: data.notes } : {},
      is_active: true,
    },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: 'super_admin',
    action: 'integration.added',
    entityType: 'integration',
    entityId: integration.integration_id,
    afterState: { provider: integration.provider, integration_type: integration.integration_type },
  })

  return integration
}

export async function toggleIntegration(integrationId: string, actor: SessionUser) {
  const integration = await prisma.integrations.findUniqueOrThrow({ where: { integration_id: integrationId } })
  const updated = await prisma.integrations.update({
    where: { integration_id: integrationId },
    data: { is_active: !integration.is_active },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: 'super_admin',
    action: 'integration.changed',
    entityType: 'integration',
    entityId: integrationId,
    beforeState: { is_active: integration.is_active },
    afterState: { is_active: updated.is_active },
  })

  return updated
}

export async function removeIntegration(integrationId: string, actor: SessionUser) {
  await prisma.integrations.delete({ where: { integration_id: integrationId } })

  await recordAudit({
    actorId: actor.id,
    actorType: 'super_admin',
    action: 'integration.changed',
    entityType: 'integration',
    entityId: integrationId,
    afterState: { removed: true },
  })
}
