import { describe, it, expect } from 'vitest'
import { sumMonthlyRevenue } from './billing.service'

describe('sumMonthlyRevenue', () => {
  it('sums monthly plans as-is', () => {
    const result = sumMonthlyRevenue([
      { priceAmount: 4999, billingCycle: 'monthly' },
      { priceAmount: 12999, billingCycle: 'monthly' },
    ])
    expect(result.mrr).toBe(17998)
    expect(result.arr).toBe(215976)
  })

  it('amortizes yearly plans over 12 months', () => {
    const result = sumMonthlyRevenue([{ priceAmount: 120000, billingCycle: 'yearly' }])
    expect(result.mrr).toBe(10000)
    expect(result.arr).toBe(120000)
  })

  it('mixes monthly and yearly correctly', () => {
    const result = sumMonthlyRevenue([
      { priceAmount: 12999, billingCycle: 'monthly' },
      { priceAmount: 120000, billingCycle: 'yearly' },
    ])
    expect(result.mrr).toBe(22999)
  })

  it('returns zero for no active subscriptions', () => {
    expect(sumMonthlyRevenue([])).toEqual({ mrr: 0, arr: 0 })
  })
})
