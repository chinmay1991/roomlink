'use client'

import { useRouter } from 'next/navigation'

export function DepartmentRow({
  departmentId,
  name,
  pending,
  inProgress,
  completed,
}: {
  departmentId: string
  name: string
  pending: number
  inProgress: number
  completed: number
}) {
  const router = useRouter()
  const href = `/hotel/requests?department=${departmentId}`

  return (
    <tr
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(href)
      }}
      className="cursor-pointer hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
    >
      <td className="px-5 py-2.5 font-medium text-slate-900">{name}</td>
      <td className="px-5 py-2.5 tabular-nums text-slate-600">{pending}</td>
      <td className="px-5 py-2.5 tabular-nums text-slate-600">{inProgress}</td>
      <td className="px-5 py-2.5 tabular-nums text-slate-600">{completed}</td>
    </tr>
  )
}
