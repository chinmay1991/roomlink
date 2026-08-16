import { NextRequest, NextResponse } from 'next/server'
import { requireGuestSession } from '@/server/require-guest-session'
import { createRequestSchema } from '@/server/validation/request.schema'
import { createGuestRequest, listGuestRequests } from '@/server/services/requests.service'
import { toErrorResponse } from '@/server/api-error'

export async function GET() {
  try {
    const ctx = await requireGuestSession()
    const requests = await listGuestRequests(ctx)
    return NextResponse.json(requests)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireGuestSession()
    const body = createRequestSchema.parse(await req.json())
    const request = await createGuestRequest(ctx, body)
    return NextResponse.json(request, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
