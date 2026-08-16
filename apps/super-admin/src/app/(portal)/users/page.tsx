import Link from 'next/link'
import { listHotelAdmins } from '@/server/services/users.service'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { timeAgo } from '@/lib/format'
import { UserRowActions } from '@/components/users/user-row-actions'

export default async function UsersPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const users = await listHotelAdmins({ q: searchParams.q, status: searchParams.status })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Hotel Admins</h1>
        <p className="text-sm text-slate-500">{users.length} Hotel Admin account{users.length === 1 ? '' : 's'} across the platform.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Hotel</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last login</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.user_id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{user.full_name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    {user.hotels_users_hotel_idTohotels ? (
                      <Link href={`/hotels/${user.hotels_users_hotel_idTohotels.hotel_id}`} className="text-brand-600 hover:text-brand-700">
                        {user.hotels_users_hotel_idTohotels.name}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {user.last_login_at ? timeAgo(user.last_login_at) : 'Never signed in'}
                  </td>
                  <td className="px-5 py-3">
                    <UserRowActions
                      userId={user.user_id}
                      status={user.status}
                      initial={{ fullName: user.full_name, email: user.email, phone: user.phone ?? '' }}
                    />
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                    No Hotel Admins yet — invite one from the hotel creation wizard.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
