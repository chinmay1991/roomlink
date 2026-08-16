'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Home, ClipboardList, Bell, UserCircle } from 'lucide-react'
import { cn } from '@roomlink/ui'

const ITEMS = [
  { href: '/hotel/staff/home', label: 'Home', icon: Home },
  { href: '/hotel/staff/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/hotel/notifications', label: 'Notifications', icon: Bell },
  { href: '/hotel/staff/profile', label: 'Profile', icon: UserCircle },
]

/**
 * Staff PRD §20 — mobile-first bottom tab bar. No mobile navigation exists
 * anywhere in this app today (`Sidebar` is `hidden md:flex`); this is the
 * first one, deliberately scoped to `roleName === 'Department Staff'` only
 * so no other role's mobile experience changes. Renders nothing (not even a
 * hidden placeholder) for any other role or while the session is loading.
 */
export function StaffBottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  if (session?.user?.roleName !== 'Department Staff') return null

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary"
    >
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/hotel/notifications' && pathname?.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium',
              active ? 'text-brand-600' : 'text-slate-500'
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
