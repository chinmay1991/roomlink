import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/server/db'
import { HOTEL_PORTAL_USER_TYPES, HotelPortalUserType } from '@/lib/permissions'
import { checkLoginRateLimit, recordLoginFailure, resetLoginAttempts } from '@/server/rate-limit'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8h session
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase()
        const password = credentials?.password
        if (!email || !password) return null

        const rateLimit = checkLoginRateLimit(email)
        if (!rateLimit.allowed) {
          throw new Error(`Too many attempts. Try again in ${Math.ceil((rateLimit.retryAfterSeconds ?? 0) / 60)}m.`)
        }

        const user = await prisma.users.findUnique({ where: { email } })
        if (!user) {
          recordLoginFailure(email)
          return null
        }

        // Only hotel_admin / hotel_staff may sign in to this portal — Super
        // Admin/support staff use the separate apps/super-admin portal.
        if (!HOTEL_PORTAL_USER_TYPES.includes(user.user_type as HotelPortalUserType)) return null
        if (!user.hotel_id) return null
        if (user.status !== 'active') return null

        const validPassword = await bcrypt.compare(password, user.password_hash)
        if (!validPassword) {
          recordLoginFailure(email)
          return null
        }

        resetLoginAttempts(email)

        await prisma.users.update({
          where: { user_id: user.user_id },
          data: { last_login_at: new Date() },
        })

        const role = await prisma.roles.findUnique({ where: { role_id: user.role_id } })

        return {
          id: user.user_id,
          name: user.full_name,
          email: user.email,
          userType: user.user_type,
          roleId: user.role_id,
          roleName: role?.name ?? null,
          hotelId: user.hotel_id,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.userType = user.userType
        token.roleId = user.roleId
        token.roleName = user.roleName
        token.hotelId = user.hotelId
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.userId as string,
        userType: token.userType as string,
        roleId: token.roleId as string,
        roleName: (token.roleName as string | null) ?? null,
        hotelId: token.hotelId as string,
      }
      return session
    },
  },
}
