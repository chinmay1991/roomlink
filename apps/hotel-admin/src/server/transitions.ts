import type { request_status } from '@roomlink/db'

/** PRD §17: NEW(pending) -> ASSIGNED -> IN_PROGRESS -> COMPLETED, plus optional CANCELLED/ESCALATED. */
export const REQUEST_TRANSITIONS: Record<request_status, request_status[]> = {
  pending: ['in_progress', 'cancelled', 'escalated'],
  assigned: ['in_progress', 'cancelled', 'escalated'],
  in_progress: ['completed', 'cancelled', 'escalated'],
  completed: [],
  cancelled: [],
  escalated: ['in_progress', 'cancelled'],
}

export function canTransition<T extends string>(map: Record<T, T[]>, from: T, to: T): boolean {
  return map[from]?.includes(to) ?? false
}
