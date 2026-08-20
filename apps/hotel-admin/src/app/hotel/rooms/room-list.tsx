'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Select, StatusBadge } from '@roomlink/ui'

type Room = {
  room_id: string
  room_number: string
  floor: string | null
  status: string
  room_types: { name: string } | null
  qr_codes: { qr_code_id: string; is_active: boolean }[]
}

export function RoomList({ rooms, isNative = false }: { rooms: Room[]; isNative?: boolean }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)

  async function setStatus(roomId: string, status: string) {
    setBusyId(roomId)
    await fetch(`/api/v1/hotel/rooms/${roomId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setBusyId(null)
    router.refresh()
  }

  const statusSelect = (room: Room, className: string) => (
    <Select className={className} value={room.status} disabled={busyId === room.room_id} onChange={(e) => setStatus(room.room_id, e.target.value)}>
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
      <option value="maintenance">Maintenance</option>
    </Select>
  )

  // Native-only stacked-card layout — see the mobile-app plan's isolation
  // mechanism. Same data and the same setStatus handler as the desktop
  // table below; browsers always take the unchanged table path.
  if (isNative) {
    return (
      <Card className="overflow-hidden">
        {rooms.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">No rooms yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rooms.map((room) => (
              <li key={room.room_id} className="space-y-2 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">
                      Room {room.room_number}
                      {room.floor && <span className="font-normal text-slate-500"> · Floor {room.floor}</span>}
                    </p>
                    <p className="text-xs text-slate-500">{room.room_types?.name ?? 'No room type'}</p>
                  </div>
                  <StatusBadge status={room.status} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    QR:{' '}
                    {room.qr_codes.some((q) => q.is_active) ? (
                      <span className="text-emerald-600">Active</span>
                    ) : (
                      <span className="text-slate-400">Not generated</span>
                    )}
                  </span>
                  {statusSelect(room, 'h-9 max-w-[150px] text-xs')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Room</th>
              <th className="px-5 py-3 font-medium">Floor</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">QR</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rooms.map((room) => (
              <tr key={room.room_id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{room.room_number}</td>
                <td className="px-5 py-3 text-slate-600">{room.floor ?? '—'}</td>
                <td className="px-5 py-3 text-slate-600">{room.room_types?.name ?? '—'}</td>
                <td className="px-5 py-3 text-slate-600">
                  {room.qr_codes.some((q) => q.is_active) ? (
                    <span className="text-emerald-600">Active</span>
                  ) : (
                    <span className="text-slate-400">Not generated</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={room.status} />
                </td>
                <td className="px-5 py-3 text-right">
                  <Select
                    className="h-8 max-w-[140px] text-xs"
                    value={room.status}
                    disabled={busyId === room.room_id}
                    onChange={(e) => setStatus(room.room_id, e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </Select>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                  No rooms yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
