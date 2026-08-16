import { requireHotelPageSession } from '@/server/require-hotel-page-session'
import { getHotelSettings } from '@/server/services/hotel-settings.service'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const session = await requireHotelPageSession()
  const settings = await getHotelSettings(session.user.hotelId)

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
      <SettingsForm
        initial={{
          welcomeMessage: settings.welcome_message ?? '',
          guestInstructions: settings.guest_instructions ?? '',
          wifiName: settings.wifi_name ?? '',
          wifiPassword: settings.wifi_password ?? '',
          notifyCriticalRequests: settings.notify_critical_requests,
          notifyUnassigned: settings.notify_unassigned,
          notifyGuestMessages: settings.notify_guest_messages,
        }}
      />
    </div>
  )
}
