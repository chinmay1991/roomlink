'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type CartItem = { itemId: string; name: string; price: number; quantity: number }

type CartContextValue = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  setQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  clear: () => void
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'roomlink_guest_cart'

/**
 * Client-side cart state, persisted to `localStorage` so it survives
 * navigating between /menu and /cart. Scoped to this browser only — no
 * server round-trip until "Place Order" (PRD §16/§17: add/change quantity/
 * remove/view cart are all pre-order, in-browser actions).
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        setItems(JSON.parse(raw))
      } catch {
        // ignore corrupt cart data
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addItem(item: Omit<CartItem, 'quantity'>) {
    setItems((prev) => {
      const existing = prev.find((i) => i.itemId === item.itemId)
      if (existing) return prev.map((i) => (i.itemId === item.itemId ? { ...i, quantity: i.quantity + 1 } : i))
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  function setQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) return removeItem(itemId)
    setItems((prev) => prev.map((i) => (i.itemId === itemId ? { ...i, quantity } : i)))
  }

  function removeItem(itemId: string) {
    setItems((prev) => prev.filter((i) => i.itemId !== itemId))
  }

  function clear() {
    setItems([])
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return <CartContext.Provider value={{ items, addItem, setQuantity, removeItem, clear, subtotal }}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
