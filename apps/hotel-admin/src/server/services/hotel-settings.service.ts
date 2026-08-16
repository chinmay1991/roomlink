import { prisma } from '@/server/db'
import { recordAudit } from '@/server/audit'
import { markStepComplete } from '@/server/services/hotel-onboarding.service'
import type { UpdateHotelSettingsInput } from '@/server/validation/hotel-settings.schema'
import type { HotelSessionUser } from '@/server/require-hotel-session'

export async function getHotelSettings(hotelId: string) {
  const existing = await prisma.hotel_settings.findUnique({ where: { hotel_id: hotelId } })
  if (existing) return existing

  return prisma.hotel_settings.create({ data: { hotel_id: hotelId } })
}

export async function updateHotelSettings(hotelId: string, input: UpdateHotelSettingsInput, actor: HotelSessionUser) {
  const after = await prisma.hotel_settings.upsert({
    where: { hotel_id: hotelId },
    update: {
      welcome_message: input.welcomeMessage || null,
      guest_instructions: input.guestInstructions || null,
      wifi_name: input.wifiName || null,
      wifi_password: input.wifiPassword || null,
      notify_critical_requests: input.notifyCriticalRequests,
      notify_unassigned: input.notifyUnassigned,
      notify_guest_messages: input.notifyGuestMessages,
    },
    create: {
      hotel_id: hotelId,
      welcome_message: input.welcomeMessage || null,
      guest_instructions: input.guestInstructions || null,
      wifi_name: input.wifiName || null,
      wifi_password: input.wifiPassword || null,
      notify_critical_requests: input.notifyCriticalRequests,
      notify_unassigned: input.notifyUnassigned,
      notify_guest_messages: input.notifyGuestMessages,
    },
  })

  await recordAudit({
    actorId: actor.id,
    actorType: actor.userType,
    action: 'hotel_settings.updated',
    entityType: 'hotel',
    entityId: hotelId,
  })

  await markStepComplete(hotelId, 'Notifications & Settings')

  return after
}
