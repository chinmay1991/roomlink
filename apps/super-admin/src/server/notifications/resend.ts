import type { NotificationProvider } from './provider'

/** Plain fetch against Resend's REST API — no SDK dependency needed for one endpoint. */
export function createResendProvider(apiKey: string, from: string): NotificationProvider {
  return {
    async sendEmail(to, subject, body) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, subject, text: body }),
      })
      if (!res.ok) {
        throw new Error(`Resend API error: ${res.status} ${await res.text()}`)
      }
    },
  }
}
