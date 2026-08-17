import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveQrCode, verifyGuestMobile } from './session.service'
import { SessionNotActiveError, MobileMismatchError, RateLimitedError } from '@/server/errors'

const mockPrisma = vi.hoisted(() => ({
  qr_codes: { findUnique: vi.fn() },
  guest_sessions: { findFirst: vi.fn(), update: vi.fn() },
  audit_logs: { create: vi.fn() },
}))

vi.mock('@/server/db', () => ({ prisma: mockPrisma }))

const HOTEL_A = { hotel_id: 'hotel-a', room_id: 'room-a', room_number: '101' }
const HOTEL_B = { hotel_id: 'hotel-b', room_id: 'room-b', room_number: '202' }
const MOBILE_A = '+919876543210'
const MOBILE_B = '+919876500000'

function qrRow(overrides: Partial<{ is_active: boolean; roomStatus: string }> = {}, room = HOTEL_A) {
  return {
    code_value: 'code-a',
    is_active: overrides.is_active ?? true,
    rooms: {
      hotel_id: room.hotel_id,
      room_id: room.room_id,
      room_number: room.room_number,
      status: overrides.roomStatus ?? 'active',
      hotels: { name: 'Hotel A' },
    },
  }
}

function sessionRow(overrides: Record<string, unknown> = {}, room = HOTEL_A, mobile = MOBILE_A) {
  return {
    session_id: 'session-1',
    hotel_id: room.hotel_id,
    room_id: room.room_id,
    guest_id: null,
    guest_mobile_e164: mobile,
    expires_at: new Date(Date.now() + 60 * 60 * 1000),
    status: 'active',
    failed_verification_attempts: 0,
    verification_locked_until: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('resolveQrCode', () => {
  it('resolves an active QR to its hotel + room', async () => {
    mockPrisma.qr_codes.findUnique.mockResolvedValue(qrRow())
    mockPrisma.guest_sessions.findFirst.mockResolvedValue(sessionRow())

    const result = await resolveQrCode('code-a')
    expect(result).toEqual({ hotelId: 'hotel-a', hotelName: 'Hotel A', roomId: 'room-a', roomNumber: '101' })
  })

  it('rejects an unknown code_value', async () => {
    mockPrisma.qr_codes.findUnique.mockResolvedValue(null)
    await expect(resolveQrCode('nope')).rejects.toMatchObject({ reason: 'invalid_qr' })
  })

  it('rejects a deactivated (regenerated) QR', async () => {
    mockPrisma.qr_codes.findUnique.mockResolvedValue(qrRow({ is_active: false }))
    await expect(resolveQrCode('code-a')).rejects.toMatchObject({ reason: 'invalid_qr' })
  })

  it('rejects a QR for an inactive room', async () => {
    mockPrisma.qr_codes.findUnique.mockResolvedValue(qrRow({ roomStatus: 'inactive' }))
    await expect(resolveQrCode('code-a')).rejects.toMatchObject({ reason: 'room_inactive' })
  })

  it('rejects when there is no active stay for the room', async () => {
    mockPrisma.qr_codes.findUnique.mockResolvedValue(qrRow())
    mockPrisma.guest_sessions.findFirst.mockResolvedValue(null)
    await expect(resolveQrCode('code-a')).rejects.toMatchObject({ reason: 'no_active_stay' })
  })

  it('rejects an expired stay session', async () => {
    mockPrisma.qr_codes.findUnique.mockResolvedValue(qrRow())
    mockPrisma.guest_sessions.findFirst.mockResolvedValue(sessionRow({ expires_at: new Date(Date.now() - 1000) }))
    await expect(resolveQrCode('code-a')).rejects.toMatchObject({ reason: 'session_expired' })
  })

  it('never lets one room resolve to another room/hotel', async () => {
    mockPrisma.qr_codes.findUnique.mockResolvedValue(qrRow({}, HOTEL_A))
    mockPrisma.guest_sessions.findFirst.mockResolvedValue(sessionRow({}, HOTEL_A))
    const a = await resolveQrCode('code-a')

    mockPrisma.qr_codes.findUnique.mockResolvedValue(qrRow({}, HOTEL_B))
    mockPrisma.guest_sessions.findFirst.mockResolvedValue(sessionRow({}, HOTEL_B))
    const b = await resolveQrCode('code-b')

    expect(a.hotelId).not.toBe(b.hotelId)
    expect(a.roomId).not.toBe(b.roomId)
  })
})

describe('verifyGuestMobile', () => {
  function setupActiveSession(overrides: Record<string, unknown> = {}, room = HOTEL_A, mobile = MOBILE_A) {
    mockPrisma.qr_codes.findUnique.mockResolvedValue(qrRow({}, room))
    mockPrisma.guest_sessions.findFirst.mockResolvedValue(sessionRow(overrides, room, mobile))
  }

  it('returns the session on a correct, exactly-matching mobile number', async () => {
    setupActiveSession()
    const session = await verifyGuestMobile({ codeValue: 'code-a', mobile: MOBILE_A })
    expect(session.session_id).toBe('session-1')
  })

  it('matches after normalizing a loosely-formatted correct number', async () => {
    setupActiveSession()
    const session = await verifyGuestMobile({ codeValue: 'code-a', mobile: '98765 43210' })
    expect(session.session_id).toBe('session-1')
  })

  it('resets any prior failed-attempt state on success', async () => {
    setupActiveSession({ failed_verification_attempts: 2 })
    await verifyGuestMobile({ codeValue: 'code-a', mobile: MOBILE_A })
    expect(mockPrisma.guest_sessions.update).toHaveBeenCalledWith({
      where: { session_id: 'session-1' },
      data: { failed_verification_attempts: 0, verification_locked_until: null },
    })
  })

  it('rejects an incorrect mobile number and records the attempt', async () => {
    setupActiveSession()
    await expect(verifyGuestMobile({ codeValue: 'code-a', mobile: '+911111111111' })).rejects.toBeInstanceOf(
      MobileMismatchError,
    )
    expect(mockPrisma.guest_sessions.update).toHaveBeenCalledWith({
      where: { session_id: 'session-1' },
      data: { failed_verification_attempts: 1 },
    })
  })

  it('rejects the correct mobile number registered for a different room', async () => {
    // Room B's active stay is registered to MOBILE_B — verifying room A's QR with MOBILE_B must fail.
    setupActiveSession({}, HOTEL_A, MOBILE_A)
    await expect(verifyGuestMobile({ codeValue: 'code-a', mobile: MOBILE_B })).rejects.toBeInstanceOf(MobileMismatchError)
  })

  it('locks the session after the 5th consecutive wrong attempt', async () => {
    setupActiveSession({ failed_verification_attempts: 4 })
    await expect(verifyGuestMobile({ codeValue: 'code-a', mobile: '+911111111111' })).rejects.toBeInstanceOf(
      RateLimitedError,
    )
    const call = mockPrisma.guest_sessions.update.mock.calls[0][0]
    expect(call.data.failed_verification_attempts).toBe(5)
    expect(call.data.verification_locked_until).toBeInstanceOf(Date)
  })

  it('rejects even the correct mobile number while locked out', async () => {
    setupActiveSession({ verification_locked_until: new Date(Date.now() + 5 * 60 * 1000) })
    await expect(verifyGuestMobile({ codeValue: 'code-a', mobile: MOBILE_A })).rejects.toBeInstanceOf(RateLimitedError)
  })

  it('allows attempts again once the lockout window has passed', async () => {
    setupActiveSession({ verification_locked_until: new Date(Date.now() - 1000) })
    const session = await verifyGuestMobile({ codeValue: 'code-a', mobile: MOBILE_A })
    expect(session.session_id).toBe('session-1')
  })

  it('rejects an unparseable mobile number the same way as a genuine mismatch', async () => {
    setupActiveSession()
    await expect(verifyGuestMobile({ codeValue: 'code-a', mobile: 'not-a-number' })).rejects.toBeInstanceOf(
      MobileMismatchError,
    )
  })

  it('rejects a stay that expired since it was resolved', async () => {
    mockPrisma.qr_codes.findUnique.mockResolvedValue(qrRow())
    mockPrisma.guest_sessions.findFirst.mockResolvedValue(sessionRow({ expires_at: new Date(Date.now() - 1000) }))
    await expect(verifyGuestMobile({ codeValue: 'code-a', mobile: MOBILE_A })).rejects.toBeInstanceOf(
      SessionNotActiveError,
    )
  })
})
