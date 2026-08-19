'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

/** A <tr> that navigates on click/Enter — for drilling from a summary table into a filtered detail view. */
export function ClickableRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter()

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
      {children}
    </tr>
  )
}
