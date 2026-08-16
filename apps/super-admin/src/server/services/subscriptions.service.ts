import { subscription_status } from '@prisma/client'
import { prisma } from '@/server/db'
import { recordAudit } from '@/server/audit'
import { InvalidTransitionError } from '@/server/errors'
import { SUBSCRIPTION_TRANSITIONS, canTransition } from '@/server/transitions'
import type { SessionUser } from '@/server/rbac'

export { InvalidTransitionError }

export async function listSubscriptions(filters: { status?: string }) {
  return prisma.subscriptions.findMany({
    where: filters.status ? { status: filters.status as subscription_status } : undefined,
    orderBy: { created_at: 'desc' },
    include: { hotels: { select: { hotel_id: true, name: true } }, subscription_plans: true },
  })
}

async function getOr404(subscriptionId: string) {
  return prisma.subscriptions.findUniqueOrThrow({ where: { subscription_id: subscriptionId } })
}

export async function changeSubscriptionStatus(subscriptionId: string, next: subscription_status, actor: SessionUser) {
  const sub = await getOr404(subscriptionId)
  if (!canTransition(SUBSCRIPTION_TRANSITIONS, sub.status, next)) {
    throw new InvalidTransitionError(`Cannot move a ${sub.status} subscription to ${next}`)
  }

  const updated = await prisma.subscriptions.update({
    where: { subscription_id: subscriptionId },
    data: { status: next, end_date: next === 'cancelled' || next === 'expired' ? new Date() : sub.end_date },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: 'super_admin',
    action: 'subscription.status_changed',
    entityType: 'subscription',
    entityId: subscriptionId,
    beforeState: { status: sub.status },
    afterState: { status: next },
  })

  return updated
}

export async function changeSubscriptionPlan(subscriptionId: string, planId: string, actor: SessionUser) {
  const sub = await getOr404(subscriptionId)

  const updated = await prisma.subscriptions.update({
    where: { subscription_id: subscriptionId },
    data: { plan_id: planId },
  })
  await prisma.hotels.update({ where: { hotel_id: sub.hotel_id }, data: { plan_id: planId } })

  await recordAudit({
    actorId: actor.id,
    actorType: 'super_admin',
    action: 'subscription.plan_changed',
    entityType: 'subscription',
    entityId: subscriptionId,
    beforeState: { plan_id: sub.plan_id },
    afterState: { plan_id: planId },
  })

  return updated
}

export async function extendSubscriptionTrial(subscriptionId: string, days: number, actor: SessionUser) {
  const sub = await getOr404(subscriptionId)
  if (sub.status !== 'trial') {
    throw new InvalidTransitionError('Only trial subscriptions can be extended')
  }

  const base = sub.trial_end_date && sub.trial_end_date > new Date() ? sub.trial_end_date : new Date()
  const newTrialEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000)

  const updated = await prisma.subscriptions.update({
    where: { subscription_id: subscriptionId },
    data: { trial_end_date: newTrialEnd },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: 'super_admin',
    action: 'subscription.trial_extended',
    entityType: 'subscription',
    entityId: subscriptionId,
    beforeState: { trial_end_date: sub.trial_end_date },
    afterState: { trial_end_date: newTrialEnd },
  })

  return updated
}

export async function toggleAutoRenew(subscriptionId: string, actor: SessionUser) {
  const sub = await getOr404(subscriptionId)
  const updated = await prisma.subscriptions.update({
    where: { subscription_id: subscriptionId },
    data: { auto_renew: !sub.auto_renew },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: 'super_admin',
    action: 'subscription.auto_renew_toggled',
    entityType: 'subscription',
    entityId: subscriptionId,
    beforeState: { auto_renew: sub.auto_renew },
    afterState: { auto_renew: updated.auto_renew },
  })

  return updated
}
