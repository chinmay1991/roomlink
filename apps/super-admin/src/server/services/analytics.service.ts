import { prisma } from '@/server/db'
import { getMrrArr } from '@/server/services/billing.service'
import { listOnboardingStatus, isStalled } from '@/server/services/onboarding.service'

export type PlatformKpis = {
  totalHotels: number
  activeHotels: number
  trialHotels: number
  onboardingHotels: number
  totalRooms: number
  openSupportTickets: number
  failedPayments: number
}

/** Reads the v_platform_kpis view created by script.sql (Section 13). */
export async function getPlatformKpis(): Promise<PlatformKpis> {
  const rows = await prisma.$queryRaw<
    {
      total_hotels: bigint
      active_hotels: bigint
      trial_hotels: bigint
      onboarding_hotels: bigint
      total_rooms: bigint
      open_support_tickets: bigint
      failed_payments: bigint
    }[]
  >`SELECT * FROM v_platform_kpis`

  const row = rows[0]
  return {
    totalHotels: Number(row?.total_hotels ?? 0),
    activeHotels: Number(row?.active_hotels ?? 0),
    trialHotels: Number(row?.trial_hotels ?? 0),
    onboardingHotels: Number(row?.onboarding_hotels ?? 0),
    totalRooms: Number(row?.total_rooms ?? 0),
    openSupportTickets: Number(row?.open_support_tickets ?? 0),
    failedPayments: Number(row?.failed_payments ?? 0),
  }
}

export type Alert = {
  severity: 'warning' | 'critical'
  message: string
  hotelId?: string
  hotelName?: string
}

/** Epic 1's alert feed — each rule reuses a service that already exists for its own page. */
export async function getAlerts(): Promise<Alert[]> {
  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // These 5 lookups are independent — run them concurrently instead of one
  // DB round trip at a time (each round trip pays the app-to-DB region gap).
  const [trialsEnding, expiringSoon, onboarding, failedPayments, slaBreached] = await Promise.all([
    prisma.subscriptions.findMany({
      where: { status: 'trial', trial_end_date: { gte: now, lte: in7Days } },
      include: { hotels: { select: { hotel_id: true, name: true } } },
    }),
    prisma.subscriptions.findMany({
      where: { status: 'active', end_date: { gte: now, lte: in7Days } },
      include: { hotels: { select: { hotel_id: true, name: true } } },
    }),
    listOnboardingStatus(),
    prisma.payments.findMany({
      where: { status: 'failed' },
      include: { invoices: { include: { hotels: { select: { hotel_id: true, name: true } } } } },
    }),
    prisma.support_tickets.findMany({
      where: { status: { in: ['open', 'assigned'] }, created_at: { lte: dayAgo } },
      include: { hotels: { select: { hotel_id: true, name: true } } },
    }),
  ])

  const alerts: Alert[] = []

  for (const sub of trialsEnding) {
    alerts.push({
      severity: 'warning',
      message: `Trial ends ${sub.trial_end_date!.toISOString().slice(0, 10)}`,
      hotelId: sub.hotels.hotel_id,
      hotelName: sub.hotels.name,
    })
  }

  for (const sub of expiringSoon) {
    alerts.push({
      severity: 'warning',
      message: `Subscription expires ${sub.end_date!.toISOString().slice(0, 10)}`,
      hotelId: sub.hotels.hotel_id,
      hotelName: sub.hotels.name,
    })
  }

  for (const row of onboarding.filter(isStalled)) {
    alerts.push({
      severity: 'critical',
      message: `Onboarding stalled ${row.daysSinceActivity} day(s)`,
      hotelId: row.hotelId,
      hotelName: row.hotelName,
    })
  }

  for (const payment of failedPayments) {
    alerts.push({
      severity: 'critical',
      message: 'Failed payment detected',
      hotelId: payment.invoices.hotels.hotel_id,
      hotelName: payment.invoices.hotels.name,
    })
  }

  for (const ticket of slaBreached) {
    alerts.push({
      severity: 'critical',
      message: `Support ticket "${ticket.subject}" open 24h+`,
      hotelId: ticket.hotels.hotel_id,
      hotelName: ticket.hotels.name,
    })
  }

  return alerts
}

export type BusinessMetrics = {
  mrr: number
  arr: number
  churnRate: number
  activationRate: number
  trialConversionRate: number
  avgOnboardingDays: number | null
}

export async function getBusinessMetrics(): Promise<BusinessMetrics> {
  const [{ mrr, arr }, totalHotels, activeHotels, allSubs, trialSubs, convertedTrialSubs, completedOnboarding] =
    await Promise.all([
      getMrrArr(),
      prisma.hotels.count(),
      prisma.hotels.count({ where: { status: 'active' } }),
      prisma.subscriptions.count(),
      prisma.subscriptions.count({ where: { trial_end_date: { not: null } } }),
      prisma.subscriptions.count({ where: { trial_end_date: { not: null }, status: 'active' } }),
      prisma.onboarding_tracker.findMany({
        where: { step_name: 'Go Live', status: 'complete' },
        include: { hotels: { select: { created_at: true } } },
      }),
    ])

  const cancelledOrExpired = await prisma.subscriptions.count({ where: { status: { in: ['cancelled', 'expired'] } } })

  const avgOnboardingDays = completedOnboarding.length
    ? completedOnboarding.reduce((sum, step) => sum + (step.updated_at.getTime() - step.hotels.created_at.getTime()), 0) /
      completedOnboarding.length /
      (1000 * 60 * 60 * 24)
    : null

  return {
    mrr,
    arr,
    churnRate: allSubs ? Math.round((cancelledOrExpired / allSubs) * 1000) / 10 : 0,
    activationRate: totalHotels ? Math.round((activeHotels / totalHotels) * 1000) / 10 : 0,
    trialConversionRate: trialSubs ? Math.round((convertedTrialSubs / trialSubs) * 1000) / 10 : 0,
    avgOnboardingDays: avgOnboardingDays !== null ? Math.round(avgOnboardingDays * 10) / 10 : null,
  }
}

export type OperationalMetrics = {
  totalChats: number
  foodOrders: number
  housekeepingRequests: number
  maintenanceTickets: number
  activeUsers: number
}

export async function getOperationalMetrics(): Promise<OperationalMetrics> {
  const [totalChats, foodOrders, housekeepingRequests, maintenanceTickets, activeUsers] = await Promise.all([
    prisma.conversations.count(),
    prisma.orders.count(),
    prisma.requests.count({ where: { departments: { name: { contains: 'Housekeeping', mode: 'insensitive' } } } }),
    prisma.requests.count({ where: { departments: { name: { contains: 'Maintenance', mode: 'insensitive' } } } }),
    prisma.users.count({ where: { last_login_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
  ])

  return { totalChats, foodOrders, housekeepingRequests, maintenanceTickets, activeUsers }
}

const FUNNEL_ORDER = ['pending', 'onboarding', 'trial', 'active', 'suspended', 'churned'] as const

export async function getPlatformCharts() {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const [hotelsAddedThisMonth, hotelsByStatus, requestsByStatus] = await Promise.all([
    prisma.hotels.count({ where: { created_at: { gte: startOfMonth } } }),
    prisma.hotels.groupBy({ by: ['status'], _count: true }),
    prisma.requests.groupBy({ by: ['status'], _count: true }),
  ])

  const statusCounts = new Map(hotelsByStatus.map((row) => [row.status, row._count]))

  return {
    hotelsAddedThisMonth,
    activationFunnel: FUNNEL_ORDER.map((status) => ({ status, count: statusCounts.get(status) ?? 0 })),
    requestsByStatus: requestsByStatus.map((row) => ({ status: row.status, count: row._count })),
    totalRequests: requestsByStatus.reduce((sum, row) => sum + row._count, 0),
  }
}

export type GeoRow = { label: string; count: number }

export async function getGeographicBreakdown() {
  const hotels = await prisma.hotels.findMany({ select: { city: true, state: true, country: true } })

  function tally(pick: (h: (typeof hotels)[number]) => string | null) {
    const map = new Map<string, number>()
    for (const hotel of hotels) {
      const key = pick(hotel) ?? 'Unspecified'
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  }

  return {
    byCity: tally((h) => h.city),
    byState: tally((h) => h.state),
    byCountry: tally((h) => h.country),
  }
}
