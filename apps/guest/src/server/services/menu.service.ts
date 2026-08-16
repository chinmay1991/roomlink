import { prisma } from '@/server/db'

/** Guest PRD §16 — only currently orderable items: enabled by Hotel Admin and marked available. */
export async function listMenu(hotelId: string) {
  return prisma.menu_categories.findMany({
    where: { hotel_id: hotelId },
    orderBy: { display_order: 'asc' },
    include: {
      menu_items: {
        where: { status: 'active', is_available: true },
        orderBy: { name: 'asc' },
      },
    },
  })
}
