import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { getActiveImpersonation, IMPERSONATION_COOKIE } from '@/server/services/impersonation.service'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { ImpersonationBanner } from '@/components/layout/impersonation-banner'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const impersonation = await getActiveImpersonation(cookies().get(IMPERSONATION_COOKIE)?.value)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        {impersonation && (
          <ImpersonationBanner
            hotelName={impersonation.hotelName}
            hotelAdminName={impersonation.hotelAdminName}
            expiresAt={impersonation.expiresAt.toISOString()}
          />
        )}
        <Topbar />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  )
}
