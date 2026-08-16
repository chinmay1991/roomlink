'use client'

import { signOut, useSession } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InstallPrompt } from './install-prompt'

export function Topbar() {
  const { data: session } = useSession()

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <InstallPrompt />
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{session?.user?.name}</p>
          <p className="text-xs capitalize text-slate-500">{session?.user?.userType?.replace('_', ' ')}</p>
        </div>
        <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </header>
  )
}
