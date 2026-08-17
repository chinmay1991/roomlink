import { describe, it, expect } from 'vitest'
import { normalizePhone } from './phone'

describe('normalizePhone', () => {
  it('passes an already-E.164 number through unchanged', () => {
    expect(normalizePhone('+919876543210')).toBe('+919876543210')
  })

  it('strips spaces, dashes, parens, and dots', () => {
    expect(normalizePhone('+91 98765-43210')).toBe('+919876543210')
    expect(normalizePhone('+91 (987) 654.3210')).toBe('+919876543210')
  })

  it('defaults to +91 when no country code is given', () => {
    expect(normalizePhone('9876543210')).toBe('+919876543210')
  })

  it('strips a leading 0 before defaulting the country code', () => {
    expect(normalizePhone('09876543210')).toBe('+919876543210')
  })

  it('converts a leading 00 international prefix to +', () => {
    expect(normalizePhone('00919876543210')).toBe('+919876543210')
  })

  it('returns null for empty or whitespace-only input', () => {
    expect(normalizePhone('')).toBeNull()
    expect(normalizePhone('   ')).toBeNull()
  })

  it('returns null for input that cannot form a valid E.164 number', () => {
    expect(normalizePhone('abc')).toBeNull()
    expect(normalizePhone('+0123456789')).toBeNull()
  })
})
