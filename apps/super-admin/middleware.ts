import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { PORTAL_USER_TYPES, PortalUserType } from '@/lib/permissions'

export default withAuth(
  function middleware(req) {
    const userType = req.nextauth.token?.userType as string | undefined
    if (!userType || !PORTAL_USER_TYPES.includes(userType as PortalUserType)) {
      return NextResponse.redirect(new URL('/login?error=forbidden', req.url))
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: '/login' },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/hotels/:path*',
    '/subscriptions/:path*',
    '/users/:path*',
    '/onboarding/:path*',
    '/support/:path*',
    '/analytics/:path*',
    '/billing/:path*',
    '/integrations/:path*',
    '/settings/:path*',
    '/audit-logs/:path*',
    '/api/v1/:path*',
  ],
}
