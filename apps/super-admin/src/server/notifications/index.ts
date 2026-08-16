import type { NotificationProvider } from './provider'
import { consoleNotificationProvider } from './console'
import { createResendProvider } from './resend'

export function getNotificationProvider(): NotificationProvider {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (apiKey && from) return createResendProvider(apiKey, from)
  return consoleNotificationProvider
}

export type { NotificationProvider }
