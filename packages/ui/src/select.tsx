import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from './utils'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900',
        'focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
        'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
        className
      )}
      {...props}
    />
  )
)
Select.displayName = 'Select'
