'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { EditUserModal } from './edit-user-modal'

export function UserRowActions({
  userId,
  status,
  initial,
}: {
  userId: string
  status: string
  initial: { fullName: string; email: string; phone: string }
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  async function post(path: string, label: string) {
    setPending(label)
    const res = await fetch(`/api/v1/users/${userId}/${path}`, { method: 'POST' })
    const body = await res.json().catch(() => ({}))
    setPending(null)
    if (res.ok && body.tempPassword) setTempPassword(body.tempPassword)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
      {tempPassword && (
        <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
          New password: {tempPassword}
        </span>
      )}
      <button className="font-medium text-brand-600 hover:text-brand-700" onClick={() => setEditing(true)}>
        Edit
      </button>
      <button
        className="text-slate-500 hover:text-slate-800 disabled:opacity-50"
        disabled={pending !== null}
        onClick={() => post('reset-password', 'reset')}
      >
        {pending === 'reset' ? 'Resetting…' : 'Reset password'}
      </button>
      <button
        className="text-slate-500 hover:text-slate-800 disabled:opacity-50"
        disabled={pending !== null}
        onClick={() => post('resend-invite', 'invite')}
      >
        {pending === 'invite' ? 'Sending…' : 'Resend invite'}
      </button>
      <button
        className="text-slate-500 hover:text-slate-800 disabled:opacity-50"
        disabled={pending !== null}
        onClick={() => post('toggle-status', 'toggle')}
      >
        {pending === 'toggle' ? 'Updating…' : status === 'disabled' ? 'Enable' : 'Disable'}
      </button>

      {editing && <EditUserModal userId={userId} initial={initial} onClose={() => setEditing(false)} />}
    </div>
  )
}
