import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@roomlink/db'
import { UnauthorizedError, ForbiddenError, SessionNotActiveError, InvalidPinError } from '@/server/errors'

export function toErrorResponse(error: unknown) {
  if (error instanceof InvalidPinError) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: 'Your session has expired. Please contact Reception.' }, { status: 401 })
  }
  if (error instanceof SessionNotActiveError) {
    return NextResponse.json({ error: error.message, reason: error.reason }, { status: 401 })
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid input', issues: error.flatten() }, { status: 400 })
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  console.error(error)
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}
