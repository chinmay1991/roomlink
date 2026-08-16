import { describe, it, expect } from 'vitest'
import { SUBSCRIPTION_TRANSITIONS, INVOICE_TRANSITIONS, TICKET_TRANSITIONS, canTransition } from './transitions'

describe('subscription transitions', () => {
  it('allows trial -> active', () => {
    expect(canTransition(SUBSCRIPTION_TRANSITIONS, 'trial', 'active')).toBe(true)
  })

  it('allows active -> paused -> active', () => {
    expect(canTransition(SUBSCRIPTION_TRANSITIONS, 'active', 'paused')).toBe(true)
    expect(canTransition(SUBSCRIPTION_TRANSITIONS, 'paused', 'active')).toBe(true)
  })

  it('rejects resuming an already-active subscription', () => {
    expect(canTransition(SUBSCRIPTION_TRANSITIONS, 'active', 'active')).toBe(false)
  })

  it('treats cancelled and expired as terminal', () => {
    expect(canTransition(SUBSCRIPTION_TRANSITIONS, 'cancelled', 'active')).toBe(false)
    expect(canTransition(SUBSCRIPTION_TRANSITIONS, 'expired', 'trial')).toBe(false)
  })
})

describe('invoice transitions', () => {
  it('follows draft -> sent -> paid', () => {
    expect(canTransition(INVOICE_TRANSITIONS, 'draft', 'sent')).toBe(true)
    expect(canTransition(INVOICE_TRANSITIONS, 'sent', 'paid')).toBe(true)
  })

  it('rejects marking a draft invoice paid directly', () => {
    expect(canTransition(INVOICE_TRANSITIONS, 'draft', 'paid')).toBe(false)
  })

  it('only allows refunding a paid invoice', () => {
    expect(canTransition(INVOICE_TRANSITIONS, 'paid', 'refunded')).toBe(true)
    expect(canTransition(INVOICE_TRANSITIONS, 'sent', 'refunded')).toBe(false)
  })

  it('treats refunded and cancelled as terminal', () => {
    expect(canTransition(INVOICE_TRANSITIONS, 'refunded', 'sent')).toBe(false)
    expect(canTransition(INVOICE_TRANSITIONS, 'cancelled', 'draft')).toBe(false)
  })
})

describe('ticket transitions', () => {
  it('follows the PRD workflow open -> assigned -> in_progress -> resolved -> closed', () => {
    expect(canTransition(TICKET_TRANSITIONS, 'open', 'assigned')).toBe(true)
    expect(canTransition(TICKET_TRANSITIONS, 'assigned', 'in_progress')).toBe(true)
    expect(canTransition(TICKET_TRANSITIONS, 'in_progress', 'resolved')).toBe(true)
    expect(canTransition(TICKET_TRANSITIONS, 'resolved', 'closed')).toBe(true)
  })

  it('rejects skipping straight from in_progress back to open', () => {
    expect(canTransition(TICKET_TRANSITIONS, 'in_progress', 'open')).toBe(false)
  })

  it('allows reopening a resolved or closed ticket', () => {
    expect(canTransition(TICKET_TRANSITIONS, 'resolved', 'in_progress')).toBe(true)
    expect(canTransition(TICKET_TRANSITIONS, 'closed', 'in_progress')).toBe(true)
  })
})
