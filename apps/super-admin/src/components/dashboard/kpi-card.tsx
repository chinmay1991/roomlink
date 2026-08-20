import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  href,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'default' | 'warning' | 'critical'
  href?: string
}) {
  const card = (
    <Card className={cn('h-full', href && 'transition-shadow hover:shadow-md hover:border-brand-300')}>
      <CardBody className="flex h-full items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p
            className={cn(
              'mt-1.5 text-2xl font-semibold tabular-nums',
              tone === 'critical' && 'text-red-600',
              tone === 'warning' && 'text-amber-600',
              tone === 'default' && 'text-slate-900'
            )}
          >
            {value}
          </p>
        </div>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md',
            tone === 'critical' ? 'bg-red-50 text-red-600' : tone === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-600'
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </CardBody>
    </Card>
  )

  if (!href) return card

  return (
    <Link href={href} className="block h-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
      {card}
    </Link>
  )
}
