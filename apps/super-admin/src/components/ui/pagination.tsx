import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number
  totalPages: number
  buildHref: (page: number) => string
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-600">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={cn(
            'rounded-md border border-slate-300 px-3 py-1.5',
            page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
          )}
        >
          Previous
        </Link>
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={cn(
            'rounded-md border border-slate-300 px-3 py-1.5',
            page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
          )}
        >
          Next
        </Link>
      </div>
    </div>
  )
}
