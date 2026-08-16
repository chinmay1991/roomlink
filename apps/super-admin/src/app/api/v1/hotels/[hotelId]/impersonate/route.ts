import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { ForbiddenError } from '@/server/rbac'
import { toErrorResponse } from '@/server/api-error'
import { startImpersonation, IMPERSONATION_COOKIE, IMPERSONATION_MAX_AGE_SECONDS, NoHotelAdminError } from '@/server/services/impersonation.service'

export async function POST(req: NextRequest, { params }: { params: { hotelId: string } }) {
  try {
    const { user, ip } = await requireSession(req)
    // Impersonation is the platform's most sensitive action — super_admin only, no exceptions via role_permissions.
    if (user.userType !== 'super_admin') throw new ForbiddenError('Only Super Admin can impersonate')

    const session = await startImpersonation(params.hotelId, user.id, ip)

    const res = NextResponse.json({ hotelId: params.hotelId }, { status: 201 })
    res.cookies.set(IMPERSONATION_COOKIE, session.session_id, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: IMPERSONATION_MAX_AGE_SECONDS,
      path: '/',
    })
    return res
  } catch (error) {
    if (error instanceof NoHotelAdminError) {
      return NextResponse.json({ error: 'This hotel has no Hotel Admin to impersonate yet.' }, { status: 400 })
    }
    return toErrorResponse(error)
  }
}
