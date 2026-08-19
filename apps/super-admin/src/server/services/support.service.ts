import { ticket_status } from '@prisma/client'
import { prisma } from '@/server/db'
import { recordAudit } from '@/server/audit'
import { InvalidTransitionError } from '@/server/errors'
import { TICKET_TRANSITIONS, canTransition } from '@/server/transitions'
import type { SessionUser } from '@/server/rbac'

export async function listTickets(filters: { status?: string; category?: string }) {
  return prisma.support_tickets.findMany({
    where: {
      ...(filters.status === '__open__'
        ? { status: { notIn: ['resolved', 'closed'] } }
        : filters.status
          ? { status: filters.status as ticket_status }
          : {}),
      ...(filters.category ? { category: filters.category } : {}),
    },
    orderBy: { created_at: 'desc' },
    include: {
      hotels: { select: { hotel_id: true, name: true } },
      users_support_tickets_assigned_toTousers: { select: { full_name: true } },
    },
  })
}

export async function getTicket(ticketId: string) {
  return prisma.support_tickets.findUnique({
    where: { ticket_id: ticketId },
    include: {
      hotels: { select: { hotel_id: true, name: true } },
      users_support_tickets_raised_byTousers: { select: { full_name: true, email: true } },
      users_support_tickets_assigned_toTousers: { select: { user_id: true, full_name: true } },
      ticket_messages: { orderBy: { created_at: 'asc' }, include: { users: { select: { full_name: true } } } },
    },
  })
}

export async function addTicketMessage(ticketId: string, senderId: string, content: string) {
  return prisma.ticket_messages.create({ data: { ticket_id: ticketId, sender_id: senderId, content } })
}

export async function assignTicketToMe(ticketId: string, actor: SessionUser) {
  const ticket = await prisma.support_tickets.findUniqueOrThrow({ where: { ticket_id: ticketId } })
  if (!canTransition(TICKET_TRANSITIONS, ticket.status, 'assigned') && ticket.status !== 'open') {
    throw new InvalidTransitionError(`Cannot assign a ${ticket.status} ticket`)
  }

  const updated = await prisma.support_tickets.update({
    where: { ticket_id: ticketId },
    data: { assigned_to: actor.id, status: ticket.status === 'open' ? 'assigned' : ticket.status },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: 'super_admin',
    action: 'ticket.assigned',
    entityType: 'ticket',
    entityId: ticketId,
    afterState: { assigned_to: actor.id },
  })

  return updated
}

export async function changeTicketStatus(ticketId: string, next: ticket_status, actor: SessionUser) {
  const ticket = await prisma.support_tickets.findUniqueOrThrow({ where: { ticket_id: ticketId } })
  if (!canTransition(TICKET_TRANSITIONS, ticket.status, next)) {
    throw new InvalidTransitionError(`Cannot move a ${ticket.status} ticket to ${next}`)
  }

  const updated = await prisma.support_tickets.update({
    where: { ticket_id: ticketId },
    data: { status: next, resolved_at: next === 'resolved' ? new Date() : ticket.resolved_at },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: 'super_admin',
    action: 'ticket.status_changed',
    entityType: 'ticket',
    entityId: ticketId,
    beforeState: { status: ticket.status },
    afterState: { status: next },
  })

  return updated
}
