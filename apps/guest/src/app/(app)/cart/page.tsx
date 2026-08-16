'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Card, Button, formatCurrency } from '@roomlink/ui'
import { useCart } from '@/components/cart-context'

/** Guest PRD §16/§17 — review cart, place order. Subtotal only, no tax/service-charge calc (none exists yet). */
export default function CartPage() {
  const router = useRouter()
  const { items, setQuantity, removeItem, clear, subtotal } = useCart()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function placeOrder() {
    setBusy(true)
    setError(null)
    const res = await fetch('/api/guest/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map((i) => ({ itemId: i.itemId, quantity: i.quantity })) }),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Unable to place your order. Please try again.')
      return
    }
    clear()
    router.push('/orders')
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Your Cart</h1>
        <Card>
          <p className="px-4 py-10 text-center text-sm text-slate-500">Your cart is empty.</p>
        </Card>
        <Link href="/menu" className="block text-center text-sm font-medium text-brand-600">
          Browse the menu →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Your Cart</h1>

      <Card className="divide-y divide-slate-100 overflow-hidden">
        {items.map((i) => (
          <div key={i.itemId} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{i.name}</p>
              <p className="text-xs text-slate-500">{formatCurrency(i.price)} each</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setQuantity(i.itemId, i.quantity - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                aria-label={`Decrease ${i.name} quantity`}
              >
                <Minus className="h-3.5 w-3.5" aria-hidden />
              </button>
              <span className="w-5 text-center text-sm font-medium">{i.quantity}</span>
              <button
                onClick={() => setQuantity(i.itemId, i.quantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                aria-label={`Increase ${i.name} quantity`}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button onClick={() => removeItem(i.itemId)} className="ml-1 text-red-500" aria-label={`Remove ${i.name}`}>
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </Card>

      <Card className="flex items-center justify-between p-4">
        <span className="text-sm font-medium text-slate-600">Subtotal</span>
        <span className="text-lg font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
      </Card>

      {error && <p className="rounded-md bg-red-50 px-3.5 py-2 text-sm text-red-700">{error}</p>}

      <Button className="w-full" disabled={busy} onClick={placeOrder}>
        {busy ? 'Placing order…' : 'Place Order'}
      </Button>
    </div>
  )
}
