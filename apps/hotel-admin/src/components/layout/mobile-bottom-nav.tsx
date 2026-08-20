'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { MoreHorizontal, LogOut } from 'lucide-react'
import { Modal, cn } from '@roomlink/ui'
import { mobileNavItemsForRole, type MobileNavItem } from './mobile-nav-items'

const MAX_TABS = 4

function isActive(pathname: string | null, item: MobileNavItem) {
  if (item.group) return item.group.some((g) => pathname?.startsWith(g))
  return pathname === item.href
}

/**
 * Native-app-only bottom tab bar for all 4 roles — mounted exclusively from
 * MobileShell (itself only rendered when isNativeClient() is true). Distinct
 * from StaffBottomNav, which stays untouched and keeps rendering in browsers
 * for Department Staff exactly as it does today.
 */
export function MobileBottomNav({ roleName }: { roleName: string | null }) {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)
  const items = mobileNavItemsForRole(roleName)
  const tabs = items.slice(0, MAX_TABS)
  const overflow = items.slice(MAX_TABS)

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        {tabs.map((item) => {
          const active = isActive(pathname, item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium',
                active ? 'text-brand-600' : 'text-slate-500'
              )}
            >
              <item.icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          )
        })}
        {overflow.length > 0 && (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium',
              overflow.some((item) => isActive(pathname, item)) ? 'text-brand-600' : 'text-slate-500'
            )}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
            More
          </button>
        )}
      </nav>

      {showMore && (
        <Modal title="More" onClose={() => setShowMore(false)}>
          <ul className="-mx-5 -my-4 divide-y divide-slate-100">
            {overflow.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <item.icon className="h-4 w-4 text-slate-400" aria-hidden />
                  {item.label}
                </Link>
              </li>
            ))}
            {/*
              MobileShell has no Topbar (that's where sign-out lives for
              every role except Department Staff, whose bottom nav points at
              a dedicated Profile page with its own sign-out button instead).
              This sheet is the only reachable surface left for the other
              three roles, so it's sign-out's home in the native app.
            */}
            <li>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </button>
            </li>
          </ul>
        </Modal>
      )}
    </>
  )
}
