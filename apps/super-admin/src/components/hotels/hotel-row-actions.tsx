'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImpersonateButton } from './impersonate-button'

const FUTURE_ACTIONS = [
  { label: 'Suspend hotel', phase: 'later' },
  { label: 'Send onboarding reminder', phase: 'later' },
  { label: 'Delete hotel', phase: 'later' },
]

export function HotelRowActions({ hotelId }: { hotelId: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/hotels/${hotelId}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
        View
      </Link>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
          aria-label="More actions"
          aria-expanded={open}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>
        {open && (
          <div
            className={cn(
              'absolute right-0 z-10 mt-1 w-64 rounded-md border border-slate-200 bg-white py-1 shadow-lg'
            )}
            role="menu"
          >
            <div className="px-3 py-2">
              <ImpersonateButton hotelId={hotelId} variant="ghost" />
            </div>
            <div className="my-1 border-t border-slate-100" />
            {FUTURE_ACTIONS.map((action) => (
              <div
                key={action.label}
                className="flex cursor-not-allowed items-center justify-between px-3 py-2 text-sm text-slate-400"
                title="Not built yet"
              >
                {action.label}
                <span className="text-xs text-slate-300">Soon</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
