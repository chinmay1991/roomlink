import { QrCode } from 'lucide-react'
import { Card } from '@roomlink/ui'

/**
 * There's no "log in from scratch" path for a guest — access always starts
 * from a room's physical QR (`/r/[code]`). This is only what a visitor sees
 * if they land here directly (bookmarked the bare domain, mistyped, etc.).
 */
export default function RootPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="max-w-sm space-y-3 p-8 text-center">
        <QrCode className="mx-auto h-10 w-10 text-brand-600" aria-hidden />
        <h1 className="text-lg font-semibold text-slate-900">Welcome to RoomLink</h1>
        <p className="text-sm text-slate-600">Scan the RoomLink QR code in your room to get started.</p>
      </Card>
    </main>
  )
}
