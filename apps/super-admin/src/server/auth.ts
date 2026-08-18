import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { waitUntil } from '@vercel/functions'
import { prisma } from '@/server/db'
import { PORTAL_USER_TYPES, PortalUserType } from '@/lib/permissions'
import { checkLoginRateLimit, recordLoginFailure, resetLoginAttempts } from '@/server/rate-limit'
import { verifyMfaToken } from '@/server/services/mfa.service'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8h session
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        mfaToken: { label: 'Authenticator code', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase()
        const password = credentials?.password
        const mfaToken = credentials?.mfaToken?.trim()
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

        // Only super_admin / support_staff may sign in to this portal.
        if (!PORTAL_USER_TYPES.includes(user.user_type as PortalUserType)) return null
        if (user.status !== 'active') return null

        const validPassword = await bcrypt.compare(password, user.password_hash)
        if (!validPassword) {
          recordLoginFailure(email)
          return null
        }

        if (user.mfa_enabled && user.mfa_secret) {
          if (!mfaToken) throw new Error('MFA_REQUIRED')
          if (!verifyMfaToken(user.mfa_secret, mfaToken)) {
            recordLoginFailure(email)
            throw new Error('Incorrect authenticator code.')
          }
        }

        resetLoginAttempts(email)

        // Don't hold up the login response for a bookkeeping write — record it
        // in the background. waitUntil keeps the serverless function alive
        // until the update settles instead of racing the response teardown.
        waitUntil(
          prisma.users
            .update({ where: { user_id: user.user_id }, data: { last_login_at: new Date() } })
            .catch((err) => console.error('Failed to record last_login_at', err))
        )

        return {
          id: user.user_id,
          name: user.full_name,
          email: user.email,
          userType: user.user_type,
          roleId: user.role_id,
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
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.userId as string,
        userType: token.userType as string,
        roleId: token.roleId as string,
      }
      return session
    },
  },
}
