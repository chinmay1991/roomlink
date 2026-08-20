import Link from 'next/link'

type DepartmentSummaryRow = {
  departmentId: string
  name: string
  pending: number
  inProgress: number
  completed: number
}

/**
 * Native-only stacked-card alternative to the desktop department-summary
 * table (department-row.tsx) — rendered exclusively when isNativeClient()
 * is true, so browsers never see this. Same data, same destination as
 * DepartmentRow's row click.
 */
export function DepartmentSummaryCards({ departments }: { departments: DepartmentSummaryRow[] }) {
  if (departments.length === 0) {
    return <p className="px-1 py-6 text-center text-sm text-slate-500">No departments enabled yet.</p>
  }

  return (
    <ul className="divide-y divide-slate-100">
      {departments.map((d) => (
        <li key={d.departmentId}>
          <Link
            href={`/hotel/requests?department=${d.departmentId}`}
            className="flex items-center justify-between gap-3 px-1 py-3 text-sm hover:bg-slate-50"
          >
            <span className="font-medium text-slate-900">{d.name}</span>
            <span className="flex shrink-0 gap-3 text-xs tabular-nums text-slate-600">
              <span>{d.pending} pending</span>
              <span>{d.inProgress} in progress</span>
              <span>{d.completed} done</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
