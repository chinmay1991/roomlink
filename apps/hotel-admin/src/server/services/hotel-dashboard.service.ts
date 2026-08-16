import { prisma } from '@/server/db'

export async function getDashboardData(hotelId: string) {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [
    todaysRequests,
    pending,
    inProgress,
    completed,
    activeRooms,
    activeStaff,
    departmentCount,
    departments,
  ] = await Promise.all([
    prisma.requests.count({ where: { hotel_id: hotelId, created_at: { gte: startOfDay } } }),
    prisma.requests.count({ where: { hotel_id: hotelId, status: { in: ['pending', 'assigned'] } } }),
    prisma.requests.count({ where: { hotel_id: hotelId, status: 'in_progress' } }),
    prisma.requests.count({ where: { hotel_id: hotelId, status: 'completed', completed_at: { gte: startOfDay } } }),
    prisma.rooms.count({ where: { hotel_id: hotelId, status: 'active' } }),
    prisma.users.count({ where: { hotel_id: hotelId, user_type: 'hotel_staff', status: 'active' } }),
    prisma.departments.count({ where: { hotel_id: hotelId, is_enabled: true } }),
    prisma.departments.findMany({
      where: { hotel_id: hotelId, is_enabled: true },
      select: {
        department_id: true,
        name: true,
        requests: { select: { status: true } },
      },
    }),
  ])

  const departmentSummary = departments.map((d) => ({
    name: d.name,
    pending: d.requests.filter((r) => r.status === 'pending' || r.status === 'assigned').length,
    inProgress: d.requests.filter((r) => r.status === 'in_progress').length,
    completed: d.requests.filter((r) => r.status === 'completed').length,
  }))

  return {
    kpis: {
      todaysRequests,
      pending,
      inProgress,
      completed,
      activeRooms,
      activeStaff,
      departmentCount,
    },
    departmentSummary,
  }
}
