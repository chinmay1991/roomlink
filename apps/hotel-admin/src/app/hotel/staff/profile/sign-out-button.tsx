'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { Button } from '@roomlink/ui'

export function SignOutButton() {
  return (
    <Button variant="secondary" className="w-full" onClick={() => signOut({ callbackUrl: '/login' })}>
      <LogOut className="h-4 w-4" aria-hidden />
      Sign out
    </Button>
  )
}
