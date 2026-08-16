'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody, Input, Button, Select, FormField } from '@roomlink/ui'
import { DEFAULT_MENU_CATEGORIES } from '@/server/validation/menu.schema'

type Category = { category_id: string; name: string }

export function MenuForms({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [itemName, setItemName] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isVeg, setIsVeg] = useState<'veg' | 'non-veg' | ''>('')

  const existingCategoryNames = new Set(categories.map((c) => c.name))
  const suggestedCategories = DEFAULT_MENU_CATEGORIES.filter((c) => !existingCategoryNames.has(c))

  async function addCategory(name: string) {
    if (!name.trim()) return
    setBusy(true)
    await fetch('/api/v1/hotel/menu/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setBusy(false)
    setCategoryName('')
    router.refresh()
  }

  async function addItem() {
    if (!itemName.trim() || !categoryId || price === '') return
    setBusy(true)
    await fetch('/api/v1/hotel/menu/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: itemName.trim(),
        categoryId,
        price: Number(price),
        isVeg: isVeg ? isVeg === 'veg' : undefined,
      }),
    })
    setBusy(false)
    setItemName('')
    setPrice('')
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Categories</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c.category_id} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {c.name}
              </span>
            ))}
          </div>
          {suggestedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestedCategories.map((c) => (
                <Button key={c} variant="secondary" className="h-8 px-3 text-xs" disabled={busy} onClick={() => addCategory(c)}>
                  + {c}
                </Button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Custom category"
              className="max-w-xs"
            />
            <Button variant="secondary" disabled={busy || !categoryName.trim()} onClick={() => addCategory(categoryName)}>
              Add
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Add menu item</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <FormField label="Category" htmlFor="itemCategory" required>
            <Select id="itemCategory" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Name" htmlFor="itemName" required>
            <Input id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Price (₹)" htmlFor="itemPrice" required>
              <Input id="itemPrice" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
            </FormField>
            <FormField label="Type" htmlFor="itemVeg">
              <Select id="itemVeg" value={isVeg} onChange={(e) => setIsVeg(e.target.value as 'veg' | 'non-veg' | '')}>
                <option value="">Unspecified</option>
                <option value="veg">Vegetarian</option>
                <option value="non-veg">Non-vegetarian</option>
              </Select>
            </FormField>
          </div>
          <Button disabled={busy || !itemName.trim() || !categoryId || price === ''} onClick={addItem}>
            Add item
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
