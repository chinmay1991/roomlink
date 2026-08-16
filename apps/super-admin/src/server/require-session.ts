import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { requestIp } from '@/server/audit'
import type { SessionUser } from '@/server/rbac'

/** Every /api/v1 route handler starts by calling this. */
export async function requireSession(req: NextRequest): Promise<{ user: SessionUser; ip: string | null }> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new UnauthorizedError()
  }
  return {
    user: { id: session.user.id, userType: session.user.userType, roleId: session.user.roleId },
    ip: requestIp(req.headers),
  }
}

export class UnauthorizedError extends Error {}
