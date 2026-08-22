'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, Select, Input, Button, StatusBadge, timeAgo } from '@roomlink/ui'

type Room = { room_id: string; room_number: string }
type Session = {
  session_id: string
  status: string
  guest_mobile_e164: string | null
  issued_at: string
  expires_at: string
  rooms: { room_number: string }
  guests: { full_name: string | null } | null
}

export function GuestSessionsPanel({ sessions, rooms }: { sessions: Session[]; rooms: Room[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [roomId, setRoomId] = useState('')
  const [mobile, setMobile] = useState('')
  const [guestName, setGuestName] = useState('')
  const [activating, setActivating] = useState(false)
  const [activateError, setActivateError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMobile, setEditMobile] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  async function activate() {
    if (!roomId || !mobile) return
    setActivating(true)
    setActivateError(null)
    const res = await fetch('/api/v1/hotel/guest-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, mobile, guestName: guestName || undefined, hoursValid: 48 }),
    })
    setActivating(false)
    if (res.ok) {
      const room = rooms.find((r) => r.room_id === roomId)
      setConfirmation(`Stay activated for Room ${room?.room_number ?? ''}.`)
      setMobile('')
      setGuestName('')
      setRoomId('')
      router.refresh()
    } else {
      const data = await res.json().catch(() => null)
      setActivateError(data?.error ?? 'Could not activate stay. Please try again.')
    }
  }

  async function saveMobile(sessionId: string) {
    if (!editMobile) return
    setBusyId(sessionId)
    setEditError(null)
    const res = await fetch(`/api/v1/hotel/guest-sessions/${sessionId}/mobile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: editMobile }),
    })
    setBusyId(null)
    if (res.ok) {
      setEditingId(null)
      setEditMobile('')
      router.refresh()
    } else {
      const data = await res.json().catch(() => null)
      setEditError(data?.error ?? 'Could not update mobile number.')
    }
  }

  async function endStay(sessionId: string) {
    setBusyId(sessionId)
    await fetch(`/api/v1/hotel/guest-sessions/${sessionId}/terminate`, { method: 'POST' })
    setBusyId(null)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Activate a stay</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {confirmation && <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{confirmation}</div>}
          {activateError && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{activateError}</div>}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Room</label>
              <Select className="h-9 w-32" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                <option value="">Room…</option>
                {rooms.map((r) => (
                  <option key={r.room_id} value={r.room_id}>
                    {r.room_number}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Guest mobile number</label>
              <Input
                className="h-9 w-44"
                type="tel"
                placeholder="+919876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Guest name (optional)</label>
              <Input className="h-9 w-48" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
            </div>
            <Button disabled={activating || !roomId || !mobile} onClick={activate}>
              Activate Stay
            </Button>
          </div>
          <p className="text-xs text-slate-400">
            Activating a new stay for a room immediately ends any previous stay there — only one active stay per
            room at a time.
          </p>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Room</th>
                <th className="px-5 py-3 font-medium">Guest</th>
                <th className="px-5 py-3 font-medium">Mobile</th>
                <th className="px-5 py-3 font-medium">Started</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((s) => (
                <tr key={s.session_id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{s.rooms.room_number}</td>
                  <td className="px-5 py-3 text-slate-600">{s.guests?.full_name ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {editingId === s.session_id ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          className="h-8 w-36"
                          type="tel"
                          value={editMobile}
                          onChange={(e) => setEditMobile(e.target.value)}
                          autoFocus
                        />
                        <Button className="h-8 px-2 text-xs" disabled={busyId === s.session_id} onClick={() => saveMobile(s.session_id)}>
                          Save
                        </Button>
                        <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      s.guest_mobile_e164 ?? '—'
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{timeAgo(s.issued_at)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {s.status === 'active' && editingId !== s.session_id && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          className="h-8 px-3 text-xs"
                          onClick={() => {
                            setEditingId(s.session_id)
                            setEditMobile(s.guest_mobile_e164 ?? '')
                            setEditError(null)
                          }}
                        >
                          Edit mobile
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 px-3 text-xs text-red-600"
                          disabled={busyId === s.session_id}
                          onClick={() => endStay(s.session_id)}
                        >
                          End Stay
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                    No active stays yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {editError && <p className="px-5 py-2 text-sm text-red-700">{editError}</p>}
      </Card>
    </div>
  )
}
