import { beforeEach, describe, expect, it, vi } from 'vitest'

const analyticsEventAuditCreate = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    analyticsEventAudit: {
      create: analyticsEventAuditCreate,
    },
  },
}))

describe('analytics audit constants', () => {
  it('exports canonical reason and status values', async () => {
    const { AUDIT_REASON, AUDIT_STATUS } = await import('@/lib/analytics/audit')

    expect(AUDIT_STATUS.ACCEPTED).toBe('accepted')
    expect(AUDIT_STATUS.REJECTED).toBe('rejected')
    expect(AUDIT_STATUS.DEDUPED).toBe('deduped')
    expect(AUDIT_STATUS.FAILED).toBe('failed')
    expect(AUDIT_REASON.EVENT_RECORDED).toBe('EVENT_RECORDED')
    expect(AUDIT_REASON.DB_WRITE_FAILED).toBe('DB_WRITE_FAILED')
    expect(AUDIT_REASON.AUDIT_WRITE_FAILED).toBe('AUDIT_WRITE_FAILED')
  })
})

describe('writeAnalyticsAudit', () => {
  beforeEach(() => {
    analyticsEventAuditCreate.mockReset()
    vi.restoreAllMocks()
  })

  it('persists audit rows with normalized nullable/meta fields', async () => {
    const { AUDIT_REASON, AUDIT_STATUS, writeAnalyticsAudit } = await import('@/lib/analytics/audit')

    analyticsEventAuditCreate.mockResolvedValueOnce({ id: BigInt(1) })

    await expect(
      writeAnalyticsAudit({
        eventName: 'booking_completed',
        source: 'server',
        status: AUDIT_STATUS.ACCEPTED,
        reasonCode: AUDIT_REASON.DB_WRITE_FAILED,
      }),
    ).resolves.toBeUndefined()

    expect(analyticsEventAuditCreate).toHaveBeenCalledTimes(1)
    expect(analyticsEventAuditCreate).toHaveBeenCalledWith({
      data: {
        eventName: 'booking_completed',
        source: 'server',
        status: 'accepted',
        reasonCode: 'DB_WRITE_FAILED',
        sessionId: null,
        eventId: null,
        bookingReference: null,
        propertySlug: null,
        occurredAt: null,
        meta: {},
      },
    })
  })

  it('forwards explicit meta object exactly on successful writes', async () => {
    const { AUDIT_REASON, AUDIT_STATUS, writeAnalyticsAudit } = await import('@/lib/analytics/audit')
    const meta = {
      flow: 'checkout',
      attempt: 2,
      flags: { truncated: false },
    }

    analyticsEventAuditCreate.mockResolvedValueOnce({ id: BigInt(2) })

    await expect(
      writeAnalyticsAudit({
        eventName: 'payment_initiated',
        source: 'client',
        status: AUDIT_STATUS.ACCEPTED,
        reasonCode: AUDIT_REASON.PROPERTIES_TRUNCATED,
        meta,
      }),
    ).resolves.toBeUndefined()

    expect(analyticsEventAuditCreate).toHaveBeenCalledTimes(1)
    expect(analyticsEventAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          meta,
        }),
      }),
    )
    const createArg = analyticsEventAuditCreate.mock.calls[0]?.[0]
    expect(createArg.data.meta).toBe(meta)
  })

  it('never throws and logs AUDIT_WRITE_FAILED when DB write fails', async () => {
    const { AUDIT_REASON, AUDIT_STATUS, writeAnalyticsAudit } = await import('@/lib/analytics/audit')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    analyticsEventAuditCreate.mockRejectedValueOnce(new Error('db unavailable'))

    await expect(
      writeAnalyticsAudit({
        eventName: 'booking_completed',
        source: 'system',
        status: AUDIT_STATUS.FAILED,
        reasonCode: AUDIT_REASON.RECORDER_EXCEPTION,
        sessionId: 's_123',
        eventId: 'evt_123',
        bookingReference: 'BK-1',
        propertySlug: 'villa-1',
        occurredAt: new Date('2026-01-01T00:00:00.000Z'),
        meta: { attempt: 1 },
      }),
    ).resolves.toBeUndefined()

    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith(
      '[analytics][audit] write failed',
      expect.objectContaining({
        reasonCode: 'AUDIT_WRITE_FAILED',
        eventName: 'booking_completed',
        source: 'system',
        status: 'failed',
        error: 'db unavailable',
      }),
    )
  })
})
