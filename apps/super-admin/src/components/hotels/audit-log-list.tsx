import { Card } from '@/components/ui/card'
import { formatDateTime } from '@/lib/format'

type AuditRow = {
  log_id: bigint
  action: string
  actor_type: string
  entity_type: string
  created_at: Date
}

export function AuditLogList({ entries, emptyMessage }: { entries: AuditRow[]; emptyMessage: string }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <Card className="divide-y divide-slate-100">
      {entries.map((entry) => (
        <div key={entry.log_id.toString()} className="flex items-center justify-between px-5 py-3 text-sm">
          <div>
            <p className="font-medium text-slate-900">{entry.action}</p>
            <p className="text-xs capitalize text-slate-500">
              {entry.actor_type.replace('_', ' ')} · {entry.entity_type}
            </p>
          </div>
          <span className="whitespace-nowrap text-xs text-slate-500">{formatDateTime(entry.created_at)}</span>
        </div>
      ))}
    </Card>
  )
}
