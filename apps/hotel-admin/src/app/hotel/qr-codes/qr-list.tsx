'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button } from '@roomlink/ui'

type QrCode = { qr_code_id: string; is_active: boolean; installed_at: string | null }
type Room = { room_id: string; room_number: string; floor: string | null; qr_codes: QrCode[] }

export function QrList({ rooms }: { rooms: Room[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)

  async function generate(roomId: string, regenerate: boolean) {
    setBusyId(roomId)
    await fetch(`/api/v1/hotel/qr-codes/${roomId}?regenerate=${regenerate}`, { method: 'POST' })
    setBusyId(null)
    router.refresh()
  }

  async function markInstalled(qrCodeId: string) {
    setBusyId(qrCodeId)
    await fetch(`/api/v1/hotel/qr-codes/code/${qrCodeId}/install`, { method: 'POST' })
    setBusyId(null)
    router.refresh()
  }

  async function deactivate(qrCodeId: string) {
    setBusyId(qrCodeId)
    await fetch(`/api/v1/hotel/qr-codes/code/${qrCodeId}/deactivate`, { method: 'POST' })
    setBusyId(null)
    router.refresh()
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Room</th>
              <th className="px-5 py-3 font-medium">QR status</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rooms.map((room) => {
              const active = room.qr_codes.find((q) => q.is_active)
              return (
                <tr key={room.room_id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {room.room_number} {room.floor && <span className="text-xs text-slate-400">({room.floor})</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {!active && 'Not generated'}
                    {active && !active.installed_at && 'Generated — not yet installed'}
                    {active && active.installed_at && <span className="text-emerald-600">Active & installed</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {!active && (
                        <Button
                          variant="secondary"
                          className="h-8 px-3 text-xs"
                          disabled={busyId === room.room_id}
                          onClick={() => generate(room.room_id, false)}
                        >
                          Generate
                        </Button>
                      )}
                      {active && (
                        <>
                          <a
                            href={`/qr-card/${active.qr_code_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Print / download card
                          </a>
                          {!active.installed_at && (
                            <Button
                              variant="secondary"
                              className="h-8 px-3 text-xs"
                              disabled={busyId === active.qr_code_id}
                              onClick={() => markInstalled(active.qr_code_id)}
                            >
                              Mark installed
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            className="h-8 px-3 text-xs"
                            disabled={busyId === room.room_id}
                            onClick={() => generate(room.room_id, true)}
                          >
                            Regenerate
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-8 px-3 text-xs text-red-600"
                            disabled={busyId === active.qr_code_id}
                            onClick={() => deactivate(active.qr_code_id)}
                          >
                            Deactivate
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-500">
                  No rooms yet — add rooms first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
