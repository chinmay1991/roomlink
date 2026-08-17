import { AlertCircle } from 'lucide-react'
import { Card } from '@roomlink/ui'

/** Landed on whenever `requireGuestPageSession` can't establish a valid session — missing, expired, or ended. */
export default function SessionEndedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="max-w-sm space-y-3 p-8 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-500" aria-hidden />
        <h1 className="text-lg font-semibold text-slate-900">Your session has ended</h1>
        <p className="text-sm text-slate-600">
          Please scan your room&apos;s RoomLink QR code again, or contact the front desk to verify your stay.
        </p>
      </Card>
    </main>
  )
}
