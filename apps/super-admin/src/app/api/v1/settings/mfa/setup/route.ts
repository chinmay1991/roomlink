import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/server/require-session'
import { toErrorResponse } from '@/server/api-error'
import { beginMfaSetup } from '@/server/services/mfa.service'
import { getOwnProfile } from '@/server/services/account.service'

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req)
    const profile = await getOwnProfile(user.id)
    const setup = await beginMfaSetup(user.id, profile.email)
    return NextResponse.json(setup)
  } catch (error) {
    return toErrorResponse(error)
  }
}
