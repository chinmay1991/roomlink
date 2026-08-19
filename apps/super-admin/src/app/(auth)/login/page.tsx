import { redirect } from 'next/navigation'
import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-1 text-center">
          <Image src="/logo.png" alt="RoomLink" width={200} height={100} className="h-12 w-auto" priority />
          <p className="text-xs text-slate-500">Super Admin Portal</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-1 text-lg font-semibold text-slate-900">Sign in</h1>
          <p className="mb-6 text-sm text-slate-500">RoomLink HQ access only.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
