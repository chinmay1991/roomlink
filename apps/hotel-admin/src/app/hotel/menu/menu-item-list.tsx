'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, StatusBadge, formatCurrency } from '@roomlink/ui'

type MenuItem = {
  item_id: string
  name: string
  price: string
  is_veg: boolean | null
  is_available: boolean
  status: string
  menu_categories: { name: string }
}

export function MenuItemList({ items }: { items: MenuItem[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)

  async function toggleStatus(itemId: string) {
    setBusyId(itemId)
    await fetch(`/api/v1/hotel/menu/items/${itemId}/toggle-status`, { method: 'POST' })
    setBusyId(null)
    router.refresh()
  }

  async function toggleAvailability(itemId: string) {
    setBusyId(itemId)
    await fetch(`/api/v1/hotel/menu/items/${itemId}/toggle-availability`, { method: 'POST' })
    setBusyId(null)
    router.refresh()
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Item</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Availability</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.item_id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <span className="font-medium text-slate-900">{item.name}</span>
                  {item.is_veg !== null && (
                    <span className={`ml-2 text-xs ${item.is_veg ? 'text-emerald-600' : 'text-red-600'}`}>
                      {item.is_veg ? '● Veg' : '● Non-veg'}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-600">{item.menu_categories.name}</td>
                <td className="px-5 py-3 text-slate-600">{formatCurrency(item.price)}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleAvailability(item.item_id)}
                    disabled={busyId === item.item_id}
                    className={item.is_available ? 'text-emerald-600 text-xs' : 'text-amber-600 text-xs'}
                  >
                    {item.is_available ? 'Available' : 'Unavailable — tap to restore'}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-5 py-3 text-right">
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                    disabled={busyId === item.item_id}
                    onClick={() => toggleStatus(item.item_id)}
                  >
                    {item.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                  No menu items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
