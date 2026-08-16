'use client'

import Link from 'next/link'
import { formatCurrency } from '@roomlink/ui'
import { useCart } from '@/components/cart-context'

/** A floating "view cart" bar — only rendered once there's something in it. */
export function CartBar() {
  const { items, subtotal } = useCart()
  const count = items.reduce((n, i) => n + i.quantity, 0)
  if (count === 0) return null

  return (
    <Link
      href="/cart"
      className="fixed inset-x-4 bottom-24 z-30 flex items-center justify-between rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
    >
      <span>
        {count} item{count === 1 ? '' : 's'} · {formatCurrency(subtotal)}
      </span>
      <span>View Cart →</span>
    </Link>
  )
}
