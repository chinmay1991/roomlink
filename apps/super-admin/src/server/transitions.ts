import { subscription_status, invoice_status, ticket_status } from '@prisma/client'

/** Pure state-machine data, kept separate from the DB/audit side effects so it's unit-testable. */

export const SUBSCRIPTION_TRANSITIONS: Record<subscription_status, subscription_status[]> = {
  trial: ['active', 'cancelled', 'expired'],
  active: ['paused', 'cancelled', 'expired'],
  paused: ['active', 'cancelled'],
  cancelled: [],
  expired: [],
}

export const INVOICE_TRANSITIONS: Record<invoice_status, invoice_status[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['paid', 'overdue', 'cancelled'],
  overdue: ['paid', 'cancelled'],
  paid: ['refunded'],
  refunded: [],
  cancelled: [],
}

export const TICKET_TRANSITIONS: Record<ticket_status, ticket_status[]> = {
  open: ['assigned', 'closed'],
  assigned: ['in_progress', 'waiting_for_hotel', 'closed'],
  in_progress: ['waiting_for_hotel', 'resolved', 'closed'],
  waiting_for_hotel: ['in_progress', 'resolved', 'closed'],
  resolved: ['closed', 'in_progress'],
  closed: ['in_progress'],
}

export function canTransition<T extends string>(matrix: Record<T, T[]>, current: T, next: T): boolean {
  return matrix[current].includes(next)
}
