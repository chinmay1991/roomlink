import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { requestIp } from '@/server/audit'
import { HOTEL_PORTAL_USER_TYPES, HotelPortalUserType } from '@/lib/permissions'

export type HotelSessionUser = {
  id: string
  userType: HotelPortalUserType
  roleId: string
  roleName: string | null
  hotelId: string
}

/**
 * Every /api/v1 route handler starts by calling this. hotelId always comes
 * from the session (set at login from users.hotel_id) — callers must never
 * accept a hotel_id from the request and use it to scope a query. That's
 * what makes cross-hotel access impossible even if a client sends a foreign
 * hotel_id, per the PRD's multi-tenant security requirement.
 */
export async function requireHotelSession(req: NextRequest): Promise<{ user: HotelSessionUser; ip: string | null }> {
  const session = await getServerSession(authOptions)
  const userType = session?.user?.userType
  const hotelId = session?.user?.hotelId

  if (!session?.user || !userType || !HOTEL_PORTAL_USER_TYPES.includes(userType as HotelPortalUserType) || !hotelId) {
    throw new UnauthorizedError()
  }

  return {
    user: {
      id: session.user.id,
      userType: userType as HotelPortalUserType,
      roleId: session.user.roleId,
      roleName: session.user.roleName ?? null,
      hotelId,
    },
    ip: requestIp(req.headers),
  }
}

export class UnauthorizedError extends Error {}
