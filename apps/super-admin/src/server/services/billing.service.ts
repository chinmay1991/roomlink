import { invoice_status } from '@prisma/client'
import { prisma } from '@/server/db'
import { recordAudit } from '@/server/audit'
import { InvalidTransitionError } from '@/server/errors'
import { INVOICE_TRANSITIONS, canTransition } from '@/server/transitions'
import type { SessionUser } from '@/server/rbac'

export type Mrr = { mrr: number; arr: number }

/** Pure — yearly plans amortized /12. Exported separately so it's unit-testable without a DB. */
export function sumMonthlyRevenue(plans: { priceAmount: number; billingCycle: string }[]): Mrr {
  const mrr = plans.reduce((sum, plan) => sum + (plan.billingCycle === 'yearly' ? plan.priceAmount / 12 : plan.priceAmount), 0)
  return { mrr: Math.round(mrr * 100) / 100, arr: Math.round(mrr * 12 * 100) / 100 }
}

/** MRR/ARR aren't stored columns — script.sql has no revenue rollup view. */
export async function getMrrArr(): Promise<Mrr> {
  const activeSubs = await prisma.subscriptions.findMany({
    where: { status: 'active' },
    select: { subscription_plans: { select: { price_amount: true, billing_cycle: true } } },
  })

  return sumMonthlyRevenue(
    activeSubs.map((sub) => ({
      priceAmount: Number(sub.subscription_plans.price_amount),
      billingCycle: sub.subscription_plans.billing_cycle,
    }))
  )
}

export async function getActiveHotelAdminCount(): Promise<number> {
  return prisma.users.count({ where: { user_type: 'hotel_admin', status: 'active' } })
}

export async function listInvoices(filters: { status?: string }) {
  return prisma.invoices.findMany({
    where: filters.status ? { status: filters.status as invoice_status } : undefined,
    orderBy: { created_at: 'desc' },
    include: { hotels: { select: { hotel_id: true, name: true } } },
  })
}

async function nextInvoiceNumber() {
  const year = new Date().getFullYear()
  const count = await prisma.invoices.count({ where: { invoice_number: { startsWith: `INV-${year}-` } } })
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`
}

/** Generates a draft invoice for a hotel's current subscription. */
export async function generateInvoice(hotelId: string, actor: SessionUser) {
  const subscription = await prisma.subscriptions.findFirst({
    where: { hotel_id: hotelId },
    orderBy: { created_at: 'desc' },
    include: { subscription_plans: true },
  })
  if (!subscription) throw new InvalidTransitionError('This hotel has no subscription to invoice')

  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const invoice = await prisma.invoices.create({
    data: {
      hotel_id: hotelId,
      subscription_id: subscription.subscription_id,
      invoice_number: await nextInvoiceNumber(),
      amount: subscription.subscription_plans.price_amount,
      currency: subscription.subscription_plans.price_currency,
      status: 'draft',
      due_date: dueDate,
    },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: 'super_admin',
    action: 'invoice.generated',
    entityType: 'invoice',
    entityId: invoice.invoice_id,
    afterState: { invoice_number: invoice.invoice_number, amount: invoice.amount.toString() },
  })

  return invoice
}

async function transitionInvoice(invoiceId: string, next: invoice_status, actor: SessionUser, action: string) {
  const invoice = await prisma.invoices.findUniqueOrThrow({ where: { invoice_id: invoiceId } })
  if (!canTransition(INVOICE_TRANSITIONS, invoice.status, next)) {
    throw new InvalidTransitionError(`Cannot move a ${invoice.status} invoice to ${next}`)
  }

  const updated = await prisma.invoices.update({
    where: { invoice_id: invoiceId },
    data: { status: next, paid_date: next === 'paid' ? new Date() : invoice.paid_date },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: 'super_admin',
    action,
    entityType: 'invoice',
    entityId: invoiceId,
    beforeState: { status: invoice.status },
    afterState: { status: next },
  })

  return updated
}

/** No email provider yet (Phase 6) — this just records the invoice as sent. */
export async function sendInvoice(invoiceId: string, actor: SessionUser) {
  return transitionInvoice(invoiceId, 'sent', actor, 'invoice.sent')
}

export async function markInvoicePaid(invoiceId: string, actor: SessionUser) {
  const invoice = await transitionInvoice(invoiceId, 'paid', actor, 'invoice.paid')

  await prisma.payments.create({
    data: { invoice_id: invoiceId, amount: invoice.amount, method: 'manual', status: 'success', paid_at: new Date() },
  })

  return invoice
}

export async function refundInvoice(invoiceId: string, actor: SessionUser) {
  const invoice = await transitionInvoice(invoiceId, 'refunded', actor, 'invoice.refunded')

  await prisma.payments.create({
    data: { invoice_id: invoiceId, amount: invoice.amount, method: 'manual', status: 'refunded' },
  })

  return invoice
}

export async function exportInvoicesCsv(): Promise<string> {
  const invoices = await prisma.invoices.findMany({
    orderBy: { created_at: 'desc' },
    include: { hotels: { select: { name: true } } },
  })

  const header = 'Invoice Number,Hotel,Amount,Currency,Status,Due Date,Paid Date,Created At'
  const rows = invoices.map((inv) =>
    [
      inv.invoice_number,
      `"${inv.hotels.name.replace(/"/g, '""')}"`,
      inv.amount.toString(),
      inv.currency,
      inv.status,
      inv.due_date?.toISOString().slice(0, 10) ?? '',
      inv.paid_date?.toISOString().slice(0, 10) ?? '',
      inv.created_at.toISOString(),
    ].join(',')
  )

  return [header, ...rows].join('\n')
}
