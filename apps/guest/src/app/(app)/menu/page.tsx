import { requireGuestPageSession } from '@/server/require-guest-page-session'
import { listMenu } from '@/server/services/menu.service'
import { MenuItemCard } from './menu-item-card'
import { CartBar } from './cart-bar'

/** Guest PRD §16 — categories → items (name/description/price/veg-nonveg/availability already filtered server-side). */
export default async function MenuPage() {
  const ctx = await requireGuestPageSession()
  const categories = await listMenu(ctx.hotelId)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Order Food</h1>

      {categories.map((c) => (
        <div key={c.category_id} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.name}</h2>
          <div className="space-y-2">
            {c.menu_items.map((item) => (
              <MenuItemCard
                key={item.item_id}
                item={{ item_id: item.item_id, name: item.name, description: item.description, price: item.price.toString(), is_veg: item.is_veg }}
              />
            ))}
            {c.menu_items.length === 0 && <p className="text-sm text-slate-400">Nothing available right now.</p>}
          </div>
        </div>
      ))}
      {categories.length === 0 && <p className="text-sm text-slate-500">The restaurant menu isn&apos;t set up for this hotel yet.</p>}

      <CartBar />
    </div>
  )
}
