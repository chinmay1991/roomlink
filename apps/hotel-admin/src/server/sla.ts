import type { request_priority } from '@roomlink/db'

/**
 * "SLA risk" (PRD §4 sort, §3 "delayed" KPI) is a computed heuristic, not a
 * stored field — same "don't overbuild V1 infra" principle already applied
 * to alerts.service.ts's stale-unassigned threshold. Urgent work is flagged
 * sooner than normal work.
 */
export const SLA_RISK_MINUTES: Record<request_priority, number> = {
  urgent: 15,
  high: 30,
  normal: 60,
}

export function minutesElapsed(createdAt: Date, now: Date = new Date()): number {
  return (now.getTime() - createdAt.getTime()) / 60000
}

export function isAtSlaRisk(priority: request_priority, createdAt: Date, now: Date = new Date()): boolean {
  return minutesElapsed(createdAt, now) >= SLA_RISK_MINUTES[priority]
}
