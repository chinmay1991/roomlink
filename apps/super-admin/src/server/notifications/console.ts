import type { NotificationProvider } from './provider'

/** Default when no email provider is configured — logs instead of sending. */
export const consoleNotificationProvider: NotificationProvider = {
  async sendEmail(to, subject, body) {
    console.log(`[notifications] (no provider configured, logging only)\nTo: ${to}\nSubject: ${subject}\n\n${body}\n`)
  },
}
