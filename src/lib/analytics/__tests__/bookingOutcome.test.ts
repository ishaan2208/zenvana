import { describe, expect, it, vi } from 'vitest'

const { recordEventMock } = vi.hoisted(() => ({
  recordEventMock: vi.fn(),
}))

vi.mock('server-only', () => ({}))

vi.mock('@/lib/analytics/recorder', () => ({
  recordEvent: recordEventMock,
}))

import {
  recordBookingCompleted,
  recordPaymentFailed,
  recordPaymentInitiated,
} from '@/lib/analytics/bookingOutcome'

describe('bookingOutcome helpers', () => {
  it('maps booking completion into server analytics event', async () => {
    await recordBookingCompleted({
      bookingReference: 'BOOK123',
      propertySlug: 'zenvana-test',
      amount: 4200,
      paymentMode: 'pay_now',
    })

    expect(recordEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'booking_completed',
        source: 'server',
        propertySlug: 'zenvana-test',
      }),
    )
  })

  it('maps payment initiated event', async () => {
    await recordPaymentInitiated({
      bookingReference: 'BOOK124',
      propertySlug: 'zenvana-test',
      amount: 3200,
      paymentMode: 'pay_now',
    })

    expect(recordEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'payment_initiated',
        source: 'server',
      }),
    )
  })

  it('maps payment failed event', async () => {
    await recordPaymentFailed({
      bookingReference: 'BOOK125',
      propertySlug: 'zenvana-test',
      amount: 3200,
      paymentMode: 'pay_now',
    })

    expect(recordEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'payment_failed',
        source: 'server',
      }),
    )
  })
})
