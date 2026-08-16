'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: 'overview', label: 'Overview' },
  { href: 'subscription', label: 'Subscription' },
  { href: 'users', label: 'Users' },
  { href: 'rooms', label: 'Rooms' },
  { href: 'activity', label: 'Activity' },
  { href: 'support', label: 'Support' },
  { href: 'billing', label: 'Billing' },
  { href: 'audit', label: 'Audit Log' },
]

export function HotelTabNav({ hotelId }: { hotelId: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {TABS.map((tab) => {
        const href = `/hotels/${hotelId}/${tab.href}`
        const active = pathname === href
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
