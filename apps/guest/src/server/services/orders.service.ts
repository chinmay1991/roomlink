import { prisma } from '@/server/db'
import { recordAudit } from '@/server/audit'
import { ForbiddenError } from '@/server/errors'
import type { CreateOrderInput } from '@/server/validation/order.schema'
import type { GuestSessionContext } from '@/server/require-guest-session'

const ORDER_INCLUDE = {
  order_items: { include: { menu_items: { select: { name: true, price: true } } } },
} as const

/**
 * Guest PRD §17 — item ids are client-supplied, so each is proven to belong
 * to this hotel and still be orderable before use (same cross-tenant FK
 * discipline as `createGuestRequest`). Price is snapshotted from
 * `menu_items.price` into `order_items.unit_price` at order time, so a
 * later menu price change never retroactively changes a placed order. No
 * tax/service-charge calculation exists anywhere in this codebase yet — V1
 * stays simple, `total_amount` is the plain subtotal (PRD §17's own
 * fallback instruction).
 */
export async function createGuestOrder(ctx: GuestSessionContext, input: CreateOrderInput) {
  const itemIds = input.items.map((i) => i.itemId)
  const menuItems = await prisma.menu_items.findMany({
    where: { item_id: { in: itemIds }, hotel_id: ctx.hotelId, status: 'active', is_available: true },
  })
  if (menuItems.length !== itemIds.length) {
    throw new ForbiddenError('One or more items are no longer available')
  }
  const priceById = new Map(menuItems.map((m) => [m.item_id, m.price]))

  const totalAmount = input.items.reduce((sum, i) => sum + Number(priceById.get(i.itemId)) * i.quantity, 0)

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.orders.create({
      data: {
        hotel_id: ctx.hotelId,
        room_id: ctx.roomId,
        guest_id: ctx.guestId,
        guest_session_id: ctx.sessionId,
        status: 'pending',
        total_amount: totalAmount,
      },
    })

    await tx.order_items.createMany({
      data: input.items.map((i) => ({
        order_id: created.order_id,
        item_id: i.itemId,
        quantity: i.quantity,
        unit_price: priceById.get(i.itemId)!,
      })),
    })

    await recordAudit(
      {
        actorId: ctx.guestId,
        actorType: 'guest',
        action: 'order.created',
        entityType: 'order',
        entityId: created.order_id,
        afterState: { total_amount: totalAmount, item_count: input.items.length },
      },
      tx
    )

    return created
  })

  return prisma.orders.findUniqueOrThrow({ where: { order_id: order.order_id }, include: ORDER_INCLUDE })
}

/** Guest PRD §18/§26 — this stay's orders only, scoped by `guest_session_id`. */
export async function listGuestOrders(ctx: GuestSessionContext) {
  return prisma.orders.findMany({
    where: { guest_session_id: ctx.sessionId },
    orderBy: { created_at: 'desc' },
    include: ORDER_INCLUDE,
  })
}

export async function getGuestOrderById(ctx: GuestSessionContext, orderId: string) {
  return prisma.orders.findFirstOrThrow({
    where: { order_id: orderId, guest_session_id: ctx.sessionId },
    include: ORDER_INCLUDE,
  })
}
