import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listGuestRequests, getGuestRequestById } from './requests.service'

const mockPrisma = vi.hoisted(() => ({
  requests: { findMany: vi.fn(), findFirstOrThrow: vi.fn() },
}))

vi.mock('@/server/db', () => ({ prisma: mockPrisma }))

const CTX = { sessionId: 'session-1', hotelId: 'hotel-1', roomId: 'room-1', guestId: 'guest-1' }

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma.requests.findMany.mockResolvedValue([])
  mockPrisma.requests.findFirstOrThrow.mockResolvedValue({})
})

/**
 * A guest must only ever see their own active stay's requests — never
 * another stay that happens to share the same room or hotel. Guarding
 * against a regression that widens this to `hotel_id`/`room_id` alone,
 * which would leak history across different guests' stays in the same room.
 */
describe('guest request scoping', () => {
  it('lists requests scoped strictly to this stay session, not the room or hotel', async () => {
    await listGuestRequests(CTX)
    expect(mockPrisma.requests.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { guest_session_id: 'session-1' } }),
    )
  })

  it('looks up a single request scoped strictly to this stay session', async () => {
    await getGuestRequestById(CTX, 'request-1')
    expect(mockPrisma.requests.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({ where: { request_id: 'request-1', guest_session_id: 'session-1' } }),
    )
  })
})
