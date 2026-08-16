import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { HOTEL_PORTAL_USER_TYPES, HotelPortalUserType } from '@/lib/permissions'

export default withAuth(
  function middleware(req) {
    const userType = req.nextauth.token?.userType as string | undefined
    if (!userType || !HOTEL_PORTAL_USER_TYPES.includes(userType as HotelPortalUserType)) {
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
  matcher: ['/hotel/:path*', '/api/v1/:path*'],
}
