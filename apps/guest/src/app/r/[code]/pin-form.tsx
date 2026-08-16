'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@roomlink/ui'

export function PinForm({ codeValue, hotelName, roomNumber }: { codeValue: string; hotelName: string; roomNumber: string }) {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (pin.length !== 6) return
    setBusy(true)
    setError(null)
    const res = await fetch('/api/guest/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codeValue, pin }),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Something went wrong. Please try again.')
      setPin('')
      return
    }
    router.push('/home')
  }

  return (
    <div className="space-y-5 text-center">
      <div>
        <p className="text-sm text-slate-500">Welcome to</p>
        <h1 className="text-xl font-semibold text-slate-900">{hotelName}</h1>
        <p className="mt-1 text-sm text-slate-500">Room {roomNumber}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="pin" className="block text-sm font-medium text-slate-700">
          Enter your Guest PIN
        </label>
        <input
          id="pin"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="w-full rounded-lg border border-slate-300 px-4 py-4 text-center text-3xl font-semibold tracking-[0.5em] text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="——————"
          aria-label="6-digit Guest PIN"
        />
        <p className="text-xs text-slate-400">Ask Reception for your Guest PIN if you don&apos;t have it.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3.5 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button className="w-full" disabled={pin.length !== 6 || busy} onClick={submit}>
        {busy ? 'Verifying…' : 'Continue'}
      </Button>
    </div>
  )
}
