'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button } from '@roomlink/ui'
import { floorLabel, groupByBuilding, groupByFloor } from '@/lib/floor'
import { Pager } from '@/components/pager'

type QrCode = { qr_code_id: string; is_active: boolean; installed_at: string | null }
type Room = { room_id: string; room_number: string; floor: string | null; building: string | null; qr_codes: QrCode[] }

export function QrList({ rooms, hotelName }: { rooms: Room[]; hotelName: string }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [buildingPage, setBuildingPage] = useState(0)
  const [floorPage, setFloorPage] = useState(0)

  // Two-level grouping: a hotel with multiple buildings can have the same
  // floor number repeat per building, so floor pagination alone would
  // conflate them.
  const buildingGroups = useMemo(() => groupByBuilding(rooms, hotelName), [rooms, hotelName])
  const currentBuildingPage = Math.min(buildingPage, Math.max(0, buildingGroups.length - 1))
  const currentBuilding = buildingGroups[currentBuildingPage]

  const floorGroups = useMemo(() => groupByFloor(currentBuilding?.items ?? []), [currentBuilding])
  const currentFloorPage = Math.min(floorPage, Math.max(0, floorGroups.length - 1))
  const currentFloor = floorGroups[currentFloorPage]

  useEffect(() => {
    setFloorPage(0)
  }, [currentBuildingPage])

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
    <div className="space-y-4">
      {buildingGroups.length > 1 && (
        <Pager
          items={buildingGroups.map((g) => ({ key: g.building, label: g.building }))}
          currentIndex={currentBuildingPage}
          onSelect={setBuildingPage}
        />
      )}

      {currentFloor && (
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {currentBuilding && buildingGroups.length > 1 ? `${currentBuilding.building} · ` : ''}
          {currentFloor.floor === null ? 'Unassigned' : `Floor ${currentFloor.floor}`} ({currentFloor.items.length})
        </h3>
      )}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Room</th>
                <th className="px-5 py-3 font-medium">Building</th>
                <th className="px-5 py-3 font-medium">QR status</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(currentFloor?.items ?? []).map((room) => {
                const active = room.qr_codes.find((q) => q.is_active)
                return (
                  <tr key={room.room_id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {room.room_number} {room.floor && <span className="text-xs text-slate-400">({room.floor})</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{room.building ?? hotelName}</td>
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
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">
                    No rooms yet — add rooms first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {floorGroups.length > 1 && (
        <div className="pt-2">
          <Pager
            items={floorGroups.map((g) => ({ key: g.floor === null ? 'unassigned' : String(g.floor), label: floorLabel(g.floor) }))}
            currentIndex={currentFloorPage}
            onSelect={setFloorPage}
          />
        </div>
      )}
    </div>
  )
}
