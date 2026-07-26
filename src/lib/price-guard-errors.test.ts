import { describe, it, expect } from 'vitest'
import {
  isPriceGuardCode,
  priceChangedMessage,
  priceGuardErrorMessage,
} from './price-guard-errors'

/**
 * The checkout forms route every backend rejection through this map, so a code
 * the backend can emit but the map doesn't know would surface to a guest as a
 * raw server string. These tests pin the codes the price guard actually sends.
 */
const BACKEND_CODES = [
  'PRICE_CHANGED',
  'NO_RATE_AVAILABLE',
  'RATE_PLAN_NOT_FOUND',
  'ORDER_REQUIRED',
  'HOURLY_ORDER_REQUIRED',
  'QUOTE_STALE',
]

describe('price-guard error copy', () => {
  it('has guest-facing copy for every code the backend can return', () => {
    for (const code of BACKEND_CODES) {
      expect(isPriceGuardCode(code), code).toBe(true)
      const msg = priceGuardErrorMessage(code)
      expect(msg.length, code).toBeGreaterThan(20)
      expect(msg, code).not.toContain('_')
    }
  })

  it('does not claim unrelated errors as its own', () => {
    expect(isPriceGuardCode('UNPAID_BOOKING_EXISTS')).toBe(false)
    expect(isPriceGuardCode('PHONE_NOT_VERIFIED')).toBe(false)
    expect(isPriceGuardCode(undefined)).toBe(false)
  })

  it('falls back to the server message for an unknown code', () => {
    expect(priceGuardErrorMessage('SOMETHING_NEW', 'Server said no')).toBe(
      'Server said no',
    )
  })

  it('names the new total so the guest can decide before retrying', () => {
    expect(priceChangedMessage(1320)).toContain('₹1,320')
  })

  it('degrades to generic copy when no total came back', () => {
    expect(priceChangedMessage()).toContain('Room rates have changed')
    expect(priceChangedMessage(Number.NaN)).toContain('Room rates have changed')
  })
})
