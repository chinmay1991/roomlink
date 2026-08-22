'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, Button } from '@roomlink/ui'

/** CSV: room_number,floor,room_type,building — one room per line. Excel export as CSV works the same way. */
function parseCsv(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.toLowerCase().startsWith('room_number'))
    .map((line) => {
      const [roomNumber, floor, roomType, building] = line.split(',').map((s) => s?.trim() ?? '')
      return { roomNumber, floor, roomType, building }
    })
    .filter((row) => row.roomNumber)
}

export function BulkImport() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function onImport() {
    const rows = parseCsv(text)
    if (rows.length === 0) return
    setSubmitting(true)
    setResult(null)
    const res = await fetch('/api/v1/hotel/rooms/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    })
    const data = await res.json().catch(() => ({}))
    setSubmitting(false)
    if (res.ok) {
      setResult(`Imported ${data.count} rooms.`)
      setText('')
      router.refresh()
    } else {
      setResult(data.error ?? 'Import failed.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-slate-900">Bulk import (CSV)</h2>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-xs text-slate-500">
          One room per line: <code>room_number,floor,room_type,building</code> — floor is a number from 0 (ground) to
          100, e.g. <code>101,1,Deluxe,Tower A</code>. Building is optional — leave it blank to fall back to the
          hotel&apos;s name. Paste directly from a CSV export.
        </p>
        {result && <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">{result}</div>}
        <textarea
          rows={6}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder={'101,1,Deluxe,Tower A\n102,1,Deluxe,Tower A\n201,2,Premium,Tower B'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button variant="secondary" disabled={submitting || !text.trim()} onClick={onImport}>
          {submitting ? 'Importing…' : 'Import rooms'}
        </Button>
      </CardBody>
    </Card>
  )
}
