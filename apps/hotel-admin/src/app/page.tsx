import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { postLoginPath } from '@/lib/permissions'

export default async function RootPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  redirect(postLoginPath(session.user.roleName))
}
