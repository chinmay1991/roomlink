import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { postLoginPath } from '@/lib/permissions'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect(postLoginPath(session.user.roleName))

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            RL
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">RoomLink</p>
            <p className="text-xs text-slate-500">Hotel Admin / GM Portal</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-1 text-lg font-semibold text-slate-900">Sign in</h1>
          <p className="mb-6 text-sm text-slate-500">Manage your hotel on RoomLink.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
