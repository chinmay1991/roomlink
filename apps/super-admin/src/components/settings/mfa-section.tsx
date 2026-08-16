'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function MfaSection({ mfaEnabled }: { mfaEnabled: boolean }) {
  const router = useRouter()
  const [setup, setSetup] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null)
  const [token, setToken] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startSetup() {
    setPending(true)
    setError(null)
    const res = await fetch('/api/v1/settings/mfa/setup', { method: 'POST' })
    const body = await res.json()
    setPending(false)
    setSetup(body)
  }

  async function confirmEnable(e: React.FormEvent) {
    e.preventDefault()
    if (!setup) return
    setPending(true)
    setError(null)
    const res = await fetch('/api/v1/settings/mfa/enable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: setup.secret, token }),
    })
    setPending(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not enable 2FA.')
      return
    }
    setSetup(null)
    setToken('')
    router.refresh()
  }

  async function disable() {
    setPending(true)
    await fetch('/api/v1/settings/mfa/disable', { method: 'POST' })
    setPending(false)
    router.refresh()
  }

  if (mfaEnabled) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-emerald-700">Two-factor authentication is enabled.</p>
        <Button variant="secondary" onClick={disable} disabled={pending}>
          {pending ? 'Disabling…' : 'Disable 2FA'}
        </Button>
      </div>
    )
  }

  if (!setup) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-500">Not enabled. We strongly recommend it for Super Admin accounts.</p>
        <Button onClick={startSetup} disabled={pending}>
          {pending ? 'Preparing…' : 'Enable 2FA'}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={confirmEnable} className="space-y-3">
      <p className="text-sm text-slate-600">Scan this with Google Authenticator, 1Password, or any TOTP app.</p>
      <Image src={setup.qrCodeDataUrl} alt="2FA QR code" width={180} height={180} className="rounded-md border border-slate-200" unoptimized />
      <p className="break-all font-mono text-xs text-slate-500">Manual entry key: {setup.secret}</p>
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="max-w-[160px]">
        <Label htmlFor="mfa-confirm">Enter the 6-digit code</Label>
        <Input id="mfa-confirm" inputMode="numeric" maxLength={6} value={token} onChange={(e) => setToken(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending || token.length !== 6}>
        {pending ? 'Verifying…' : 'Confirm & enable'}
      </Button>
    </form>
  )
}
