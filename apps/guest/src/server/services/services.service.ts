import { prisma } from '@/server/db'

/**
 * Guest PRD §11 — "only show services that are enabled + available +
 * configured for the current hotel." `services.status === 'active'` is the
 * enable flag; a service's department (if any) must also be `is_enabled`,
 * since a disabled department shouldn't surface its services even if the
 * individual service row wasn't separately deactivated. Grouped by
 * department name, matching the PRD's worked example (Housekeeping /
 * Maintenance / Other).
 */
export async function listEnabledServices(hotelId: string) {
  const services = await prisma.services.findMany({
    where: {
      hotel_id: hotelId,
      status: 'active',
      OR: [{ department_id: null }, { departments: { is_enabled: true } }],
    },
    include: { departments: { select: { department_id: true, name: true } } },
    orderBy: { name: 'asc' },
  })

  const groups = new Map<string, { department_id: string | null; name: string; services: typeof services }>()
  for (const service of services) {
    const key = service.departments?.department_id ?? 'other'
    const name = service.departments?.name ?? 'Other'
    if (!groups.has(key)) groups.set(key, { department_id: service.departments?.department_id ?? null, name, services: [] })
    groups.get(key)!.services.push(service)
  }

  return Array.from(groups.values()).map((g) => ({
    department_id: g.department_id,
    name: g.name,
    services: g.services.map((s) => ({ service_id: s.service_id, name: s.name, description: s.description })),
  }))
}
