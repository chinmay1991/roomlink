'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { TICKET_CATEGORIES } from '@/server/validation/support.schema'

const STATUS_OPTIONS = ['open', 'assigned', 'in_progress', 'waiting_for_hotel', 'resolved', 'closed']

export function TicketFilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function pushParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex gap-3">
      <select
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        value={searchParams.get('status') ?? ''}
        onChange={(e) => pushParams({ status: e.target.value || null })}
      >
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, ' ')}
          </option>
        ))}
      </select>

      <select
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        value={searchParams.get('category') ?? ''}
        onChange={(e) => pushParams({ category: e.target.value || null })}
      >
        <option value="">All categories</option>
        {TICKET_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  )
}
