import { NextRequest, NextResponse } from 'next/server'
import { requireHotelSession } from '@/server/require-hotel-session'
import { toErrorResponse } from '@/server/api-error'
import { registerDeviceTokenSchema, unregisterDeviceTokenSchema } from '@/server/validation/device-token.schema'
import { registerDeviceToken, unregisterDeviceToken } from '@/server/services/device-tokens.service'

/** Called by every role's native app on each load (PushRegistration) — this is a self-scoped action, not permission-gated, so no requireCanHotel check. */
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    const body = registerDeviceTokenSchema.parse(await req.json())
    await registerDeviceToken(user.hotelId, body, user)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await requireHotelSession(req)
    const body = unregisterDeviceTokenSchema.parse(await req.json())
    await unregisterDeviceToken(user.id, body.token)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}
