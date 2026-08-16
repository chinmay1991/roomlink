/** No valid guest session cookie, or it doesn't resolve to an active, unexpired `guest_sessions` row. */
export class UnauthorizedError extends Error {}

/** The PIN itself didn't match — distinct from a missing/expired session cookie, needs its own message. */
export class InvalidPinError extends Error {}

/** A valid session exists but the requested action/resource isn't permitted for it. */
export class ForbiddenError extends Error {}

/** The room/QR/session is identifiable but not currently usable (inactive room, no active stay, expired session). */
export class SessionNotActiveError extends Error {
  constructor(public reason: 'invalid_qr' | 'room_inactive' | 'no_active_stay' | 'session_expired', message: string) {
    super(message)
  }
}
