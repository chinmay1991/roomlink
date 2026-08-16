'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, Select, Input, Button, StatusBadge, timeAgo } from '@roomlink/ui'

type Room = { room_id: string; room_number: string }
type Session = {
  session_id: string
  status: string
  issued_at: string
  expires_at: string
  rooms: { room_number: string }
  guests: { full_name: string | null } | null
}

export function GuestSessionsPanel({ sessions, rooms }: { sessions: Session[]; rooms: Room[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [roomId, setRoomId] = useState('')
  const [guestName, setGuestName] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [issued, setIssued] = useState<{ room: string; pin: string } | null>(null)

  async function issue() {
    if (!roomId) return
    setIssuing(true)
    const res = await fetch('/api/v1/hotel/guest-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, guestName: guestName || undefined, hoursValid: 48 }),
    })
    setIssuing(false)
    if (res.ok) {
      const data = await res.json()
      const room = rooms.find((r) => r.room_id === roomId)
      setIssued({ room: room?.room_number ?? '', pin: data.pin })
      setGuestName('')
      router.refresh()
    }
  }

  async function terminate(sessionId: string) {
    setBusyId(sessionId)
    await fetch(`/api/v1/hotel/guest-sessions/${sessionId}/terminate`, { method: 'POST' })
    setBusyId(null)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Issue a guest session (check-in)</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {issued && (
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Room {issued.room} — PIN: <code className="font-mono text-base">{issued.pin}</code> (share with the guest;
              shown once)
            </div>
          )}
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
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Guest name (optional)</label>
              <Input className="h-9 w-48" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
            </div>
            <Button disabled={issuing || !roomId} onClick={issue}>
              Issue session
            </Button>
          </div>
          <p className="text-xs text-slate-400">
            Any old QR photo stops working the moment a new session is issued for that room — only one active session
            per room at a time.
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
                <th className="px-5 py-3 font-medium">Issued</th>
                <th className="px-5 py-3 font-medium">Expires</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((s) => (
                <tr key={s.session_id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{s.rooms.room_number}</td>
                  <td className="px-5 py-3 text-slate-600">{s.guests?.full_name ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{timeAgo(s.issued_at)}</td>
                  <td className="px-5 py-3 text-slate-600">{timeAgo(s.expires_at)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {s.status === 'active' && (
                      <Button
                        variant="ghost"
                        className="h-8 px-3 text-xs text-red-600"
                        disabled={busyId === s.session_id}
                        onClick={() => terminate(s.session_id)}
                      >
                        Terminate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                    No guest sessions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
