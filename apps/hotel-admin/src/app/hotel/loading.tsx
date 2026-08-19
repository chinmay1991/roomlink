import { Card, Skeleton } from '@roomlink/ui'

/**
 * Next.js wraps every page under app/hotel/** in a Suspense boundary keyed
 * off this file, so it shows instantly on navigation (prefetched, not
 * data-dependent) while the destination page's server-side data fetch is
 * still in flight — the sidebar/topbar in layout.tsx stay mounted and don't
 * re-render. Deliberately generic since it's shared across ~30 differently
 * shaped pages (KPI dashboards, tables, forms); it's here to make
 * navigation feel immediate, not to mirror any one page's exact layout.
 */
export default function HotelLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-6 w-40" />
      <Card className="overflow-hidden">
        <div className="space-y-3 p-5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </Card>
    </div>
  )
}
