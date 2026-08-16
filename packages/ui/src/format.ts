import { formatDistanceToNow } from 'date-fns'

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatCurrency(amount: number | string) {
  return currencyFormatter.format(Number(amount))
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(date))
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
}

export function timeAgo(date: Date | string | null | undefined) {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}
