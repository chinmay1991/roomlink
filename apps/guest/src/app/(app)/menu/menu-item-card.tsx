'use client'

import { Plus } from 'lucide-react'
import { Card, Button, formatCurrency } from '@roomlink/ui'
import { useCart } from '@/components/cart-context'

type MenuItem = { item_id: string; name: string; description: string | null; price: string; is_veg: boolean | null }

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { addItem, items } = useCart()
  const inCart = items.find((i) => i.itemId === item.item_id)

  return (
    <Card className="flex items-start justify-between gap-3 p-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {item.is_veg !== null && (
            <span
              className={`inline-block h-3 w-3 shrink-0 rounded-sm border ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}
              aria-label={item.is_veg ? 'Veg' : 'Non-veg'}
            >
              <span className={`m-auto block h-1.5 w-1.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
            </span>
          )}
          <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
        </div>
        {item.description && <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>}
        <p className="mt-1 text-sm font-semibold text-slate-800">{formatCurrency(item.price)}</p>
      </div>
      <Button
        variant="secondary"
        className="h-8 shrink-0 px-2.5 text-xs"
        onClick={() => addItem({ itemId: item.item_id, name: item.name, price: Number(item.price) })}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        {inCart ? `Added (${inCart.quantity})` : 'Add'}
      </Button>
    </Card>
  )
}
