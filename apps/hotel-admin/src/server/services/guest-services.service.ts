import { prisma } from '@/server/db'
import { recordAudit } from '@/server/audit'
import { markStepComplete } from '@/server/services/hotel-onboarding.service'
import type { CreateServiceInput, UpdateServiceInput } from '@/server/validation/service.schema'
import type { HotelSessionUser } from '@/server/require-hotel-session'

async function assertDepartmentOwnedByHotel(hotelId: string, departmentId: string | null) {
  if (!departmentId) return
  await prisma.departments.findFirstOrThrow({ where: { department_id: departmentId, hotel_id: hotelId } })
}

export async function listServices(hotelId: string) {
  return prisma.services.findMany({
    where: { hotel_id: hotelId },
    orderBy: { name: 'asc' },
    include: { departments: { select: { department_id: true, name: true } } },
  })
}

export async function createService(hotelId: string, input: CreateServiceInput, actor: HotelSessionUser) {
  await assertDepartmentOwnedByHotel(hotelId, input.departmentId)

  const service = await prisma.services.create({
    data: {
      hotel_id: hotelId,
      department_id: input.departmentId,
      name: input.name,
      description: input.description || null,
      status: 'active',
    },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: actor.userType,
    action: 'service.created',
    entityType: 'service',
    entityId: service.service_id,
    afterState: { name: service.name, department_id: service.department_id },
  })

  await markStepComplete(hotelId, 'Guest Services')

  return service
}

export async function updateService(hotelId: string, serviceId: string, input: UpdateServiceInput, actor: HotelSessionUser) {
  await prisma.services.findFirstOrThrow({ where: { service_id: serviceId, hotel_id: hotelId } })
  await assertDepartmentOwnedByHotel(hotelId, input.departmentId)

  const after = await prisma.services.update({
    where: { service_id: serviceId },
    data: { name: input.name, description: input.description || null, department_id: input.departmentId },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: actor.userType,
    action: 'service.updated',
    entityType: 'service',
    entityId: serviceId,
    afterState: { name: after.name },
  })

  return after
}

export async function toggleServiceStatus(hotelId: string, serviceId: string, actor: HotelSessionUser) {
  const before = await prisma.services.findFirstOrThrow({ where: { service_id: serviceId, hotel_id: hotelId } })
  const nextStatus = before.status === 'active' ? 'inactive' : 'active'

  const after = await prisma.services.update({ where: { service_id: serviceId }, data: { status: nextStatus } })

  await recordAudit({
    actorId: actor.id,
    actorType: actor.userType,
    action: nextStatus === 'active' ? 'service.enabled' : 'service.disabled',
    entityType: 'service',
    entityId: serviceId,
    beforeState: { status: before.status },
    afterState: { status: after.status },
  })

  return after
}
