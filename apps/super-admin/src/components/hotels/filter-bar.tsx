'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

const STATUS_OPTIONS = ['pending', 'onboarding', 'trial', 'active', 'suspended', 'churned']

export function HotelFilterBar({ plans }: { plans: { plan_id: string; name: string }[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  function pushParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function onSearchChange(value: string) {
    setQ(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => pushParams({ q: value || null }), 350)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <Input
          value={q}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by hotel name, city, or code…"
          className="pl-9"
        />
      </div>

      <select
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        value={searchParams.get('status') ?? ''}
        onChange={(e) => pushParams({ status: e.target.value || null })}
      >
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s}
          </option>
        ))}
      </select>

      <select
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        value={searchParams.get('planId') ?? ''}
        onChange={(e) => pushParams({ planId: e.target.value || null })}
      >
        <option value="">All plans</option>
        {plans.map((plan) => (
          <option key={plan.plan_id} value={plan.plan_id}>
            {plan.name}
          </option>
        ))}
      </select>
    </div>
  )
}
