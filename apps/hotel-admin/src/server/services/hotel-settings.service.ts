import { unstable_cache, revalidateTag } from 'next/cache'
import { prisma } from '@/server/db'
import { recordAudit } from '@/server/audit'
import { markStepComplete } from '@/server/services/hotel-onboarding.service'
import type { UpdateHotelSettingsInput } from '@/server/validation/hotel-settings.schema'
import type { HotelSessionUser } from '@/server/require-hotel-session'

const settingsTag = (hotelId: string) => `hotel-settings-${hotelId}`

/**
 * Welcome message / Wi-Fi / notification prefs change rarely — cached 60s
 * per hotel and busted immediately on save via revalidateTag below, so a
 * save is never stale but repeat views in between skip the DB entirely.
 * Every page here calls requireHotelPageSession() (reads cookies), which
 * forces the whole request dynamic — route-level `revalidate` can't apply,
 * so this caches just the query itself via unstable_cache instead.
 */
export async function getHotelSettings(hotelId: string) {
  return unstable_cache(
    async (id: string) => {
      const existing = await prisma.hotel_settings.findUnique({ where: { hotel_id: id } })
      if (existing) return existing
      return prisma.hotel_settings.create({ data: { hotel_id: id } })
    },
    ['hotel-settings'],
    { revalidate: 60, tags: [settingsTag(hotelId)] }
  )(hotelId)
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
  revalidateTag(settingsTag(hotelId))

  return after
}
