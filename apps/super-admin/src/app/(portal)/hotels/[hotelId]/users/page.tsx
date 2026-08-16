import { getHotelUsers } from '@/server/services/hotels.service'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { timeAgo } from '@/lib/format'

export default async function HotelUsersPage({ params }: { params: { hotelId: string } }) {
  const users = await getHotelUsers(params.hotelId)

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Last login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.user_id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900">{user.full_name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </td>
                <td className="px-5 py-3 text-slate-600">{user.roles.name}</td>
                <td className="px-5 py-3 capitalize text-slate-600">{user.user_type.replace('_', ' ')}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {user.last_login_at ? timeAgo(user.last_login_at) : 'Never signed in'}
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                  No users yet for this hotel.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
