import { listAuditLogs } from '@/server/services/audit-logs.service'
import { Card } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { AuditFilterBar } from '@/components/audit/audit-filter-bar'
import { formatDateTime } from '@/lib/format'

export default async function AuditLogsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const { items, total, page, totalPages, entityTypes } = await listAuditLogs({
    entityType: searchParams.entityType,
    actorType: searchParams.actorType,
    q: searchParams.q,
    page: searchParams.page ? Number(searchParams.page) : 1,
  })

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams()
    if (searchParams.q) params.set('q', searchParams.q)
    if (searchParams.entityType) params.set('entityType', searchParams.entityType)
    if (searchParams.actorType) params.set('actorType', searchParams.actorType)
    if (targetPage > 1) params.set('page', String(targetPage))
    const qs = params.toString()
    return qs ? `/audit-logs?${qs}` : '/audit-logs'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500">{total} recorded action{total === 1 ? '' : 's'}.</p>
      </div>

      <AuditFilterBar entityTypes={entityTypes} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Actor</th>
                <th className="px-5 py-3 font-medium">Entity</th>
                <th className="px-5 py-3 font-medium">IP</th>
                <th className="px-5 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((log) => (
                <tr key={log.log_id.toString()} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{log.action}</td>
                  <td className="px-5 py-3 capitalize text-slate-600">{log.actor_type.replace('_', ' ')}</td>
                  <td className="px-5 py-3 text-slate-600">
                    <span className="capitalize">{log.entity_type}</span>
                    {log.entity_id && <span className="text-xs text-slate-400"> · {log.entity_id.slice(0, 8)}…</span>}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{log.ip_address ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{formatDateTime(log.created_at)}</td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                    No audit entries match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
      </Card>
    </div>
  )
}
