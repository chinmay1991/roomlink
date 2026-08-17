import { describe, it, expect, vi, beforeEach } from 'vitest'
import { issueGuestSession, updateGuestMobile } from './guest-sessions.service'
import { InvalidPhoneError, InvalidTransitionError } from '@/server/errors'

const mockPrisma = vi.hoisted(() => ({
  rooms: { findFirstOrThrow: vi.fn() },
  guests: { create: vi.fn() },
  guest_sessions: { updateMany: vi.fn(), create: vi.fn(), findFirstOrThrow: vi.fn(), update: vi.fn() },
  audit_logs: { create: vi.fn() },
}))

vi.mock('@/server/db', () => ({ prisma: mockPrisma }))

const ACTOR = { id: 'user-1', userType: 'hotel_admin' } as never

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma.rooms.findFirstOrThrow.mockResolvedValue({ room_id: 'room-1', hotel_id: 'hotel-1', status: 'active' })
  mockPrisma.guest_sessions.create.mockResolvedValue({ session_id: 'session-1' })
})

describe('issueGuestSession', () => {
  it('rejects activating a stay for a room that is not active', async () => {
    mockPrisma.rooms.findFirstOrThrow.mockResolvedValue({ room_id: 'room-1', hotel_id: 'hotel-1', status: 'inactive' })
    await expect(
      issueGuestSession('hotel-1', { roomId: 'room-1', mobile: '+919876543210', hoursValid: 48 }, ACTOR),
    ).rejects.toBeInstanceOf(InvalidTransitionError)
    expect(mockPrisma.guest_sessions.create).not.toHaveBeenCalled()
  })

  it('rejects a mobile number that cannot be normalized', async () => {
    await expect(
      issueGuestSession('hotel-1', { roomId: 'room-1', mobile: 'not-a-number', hoursValid: 48 }, ACTOR),
    ).rejects.toBeInstanceOf(InvalidPhoneError)
    expect(mockPrisma.guest_sessions.create).not.toHaveBeenCalled()
  })

  it('terminates any prior active stay for the room before creating the new one', async () => {
    await issueGuestSession('hotel-1', { roomId: 'room-1', mobile: '+919876543210', hoursValid: 48 }, ACTOR)

    expect(mockPrisma.guest_sessions.updateMany).toHaveBeenCalledWith({
      where: { hotel_id: 'hotel-1', room_id: 'room-1', status: 'active' },
      data: expect.objectContaining({ status: 'terminated' }),
    })
    const updateManyOrder = mockPrisma.guest_sessions.updateMany.mock.invocationCallOrder[0]
    const createOrder = mockPrisma.guest_sessions.create.mock.invocationCallOrder[0]
    expect(updateManyOrder).toBeLessThan(createOrder)
  })

  it('stores the normalized mobile number, not the raw input', async () => {
    await issueGuestSession('hotel-1', { roomId: 'room-1', mobile: '98765 43210', hoursValid: 48 }, ACTOR)
    const createArgs = mockPrisma.guest_sessions.create.mock.calls[0][0]
    expect(createArgs.data.guest_mobile_e164).toBe('+919876543210')
  })
})

describe('updateGuestMobile', () => {
  beforeEach(() => {
    mockPrisma.guest_sessions.findFirstOrThrow.mockResolvedValue({
      session_id: 'session-1',
      hotel_id: 'hotel-1',
      guest_mobile_e164: '+919876543210',
    })
    mockPrisma.guest_sessions.update.mockResolvedValue({ session_id: 'session-1' })
  })

  it('rotates the session token so any previously-issued browser cookie stops resolving', async () => {
    await updateGuestMobile('hotel-1', 'session-1', { mobile: '+919876500000' }, ACTOR)
    const updateArgs = mockPrisma.guest_sessions.update.mock.calls[0][0]
    expect(updateArgs.data.session_token).toEqual(expect.any(String))
    expect(updateArgs.data.session_token.length).toBeGreaterThan(0)
  })

  it('resets verification lockout state on mobile change', async () => {
    await updateGuestMobile('hotel-1', 'session-1', { mobile: '+919876500000' }, ACTOR)
    const updateArgs = mockPrisma.guest_sessions.update.mock.calls[0][0]
    expect(updateArgs.data.failed_verification_attempts).toBe(0)
    expect(updateArgs.data.verification_locked_until).toBeNull()
  })

  it('rejects an unnormalizable replacement mobile number', async () => {
    await expect(updateGuestMobile('hotel-1', 'session-1', { mobile: 'garbage' }, ACTOR)).rejects.toBeInstanceOf(
      InvalidPhoneError,
    )
    expect(mockPrisma.guest_sessions.update).not.toHaveBeenCalled()
  })
})
