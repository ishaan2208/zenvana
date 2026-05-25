import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  cookiesMock,
  headersMock,
  analyticsSessionUpsert,
  analyticsEventFindFirst,
  analyticsEventCreate,
  writeAnalyticsAudit,
  AUDIT_STATUS,
  AUDIT_REASON,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  headersMock: vi.fn(),
  analyticsSessionUpsert: vi.fn(),
  analyticsEventFindFirst: vi.fn(),
  analyticsEventCreate: vi.fn(),
  writeAnalyticsAudit: vi.fn(),
  AUDIT_STATUS: {
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    DEDUPED: 'deduped',
    FAILED: 'failed',
  } as const,
  AUDIT_REASON: {
    INVALID_EVENT_NAME: 'INVALID_EVENT_NAME',
    BOT_FILTERED: 'BOT_FILTERED',
    SESSION_UNAVAILABLE: 'SESSION_UNAVAILABLE',
    DB_WRITE_FAILED: 'DB_WRITE_FAILED',
    DEDUPE_SUPPRESSED: 'DEDUPE_SUPPRESSED',
    PROPERTIES_TRUNCATED: 'PROPERTIES_TRUNCATED',
    RECORDER_EXCEPTION: 'RECORDER_EXCEPTION',
  } as const,
}))

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
  headers: headersMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    analyticsSession: {
      upsert: analyticsSessionUpsert,
    },
    analyticsEvent: {
      findFirst: analyticsEventFindFirst,
      create: analyticsEventCreate,
    },
  },
}))

vi.mock('@/lib/analytics/audit', () => ({
  writeAnalyticsAudit,
  AUDIT_STATUS,
  AUDIT_REASON,
}))

import { ANON_SESSION_COOKIE, recordEvent } from '@/lib/analytics/recorder'

function setupRequestContext(options?: { sessionId?: string | null; userAgent?: string | null; allowCookieSet?: boolean }) {
  const sessionId = options && 'sessionId' in options ? options.sessionId : 's_existing'
  const userAgent = options && 'userAgent' in options ? options.userAgent : 'Mozilla/5.0'
  const allowCookieSet = options && 'allowCookieSet' in options ? options.allowCookieSet : true
  const cookieState = new Map<string, string>()

  if (sessionId) {
    cookieState.set(ANON_SESSION_COOKIE, sessionId)
  }

  cookiesMock.mockResolvedValue({
    get: (name: string) => {
      const value = cookieState.get(name)
      return value ? { value } : undefined
    },
    set: vi.fn((name: string, value: string) => {
      if (!allowCookieSet) {
        throw new Error('read-only cookies')
      }
      cookieState.set(name, value)
    }),
    delete: vi.fn((name: string) => {
      cookieState.delete(name)
    }),
  })

  headersMock.mockResolvedValue({
    get: (name: string) => {
      if (name === 'user-agent') return userAgent
      return null
    },
  })
}

describe('recordEvent audit instrumentation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupRequestContext()
    analyticsSessionUpsert.mockResolvedValue(undefined)
    analyticsEventFindFirst.mockResolvedValue(null)
    analyticsEventCreate.mockResolvedValue({ id: BigInt(1) })
    writeAnalyticsAudit.mockResolvedValue(undefined)
  })

  it('writes rejected audit when event name is invalid', async () => {
    await recordEvent({
      name: 'not_a_real_event',
      source: 'server',
    })

    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'not_a_real_event',
        source: 'server',
        status: AUDIT_STATUS.REJECTED,
        reasonCode: AUDIT_REASON.INVALID_EVENT_NAME,
      }),
    )
    expect(analyticsEventCreate).not.toHaveBeenCalled()
  })

  it('writes rejected audit when user-agent is filtered as bot', async () => {
    setupRequestContext({ userAgent: 'Googlebot/2.1' })

    await recordEvent({
      name: 'booking_completed',
      source: 'server',
      properties: { bookingReference: 'BK-1' },
    })

    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'booking_completed',
        status: AUDIT_STATUS.REJECTED,
        reasonCode: AUDIT_REASON.BOT_FILTERED,
      }),
    )
    expect(analyticsEventCreate).not.toHaveBeenCalled()
  })

  it('writes rejected audit when session cannot be established', async () => {
    setupRequestContext({ sessionId: null, allowCookieSet: false })

    await recordEvent({
      name: 'booking_completed',
      source: 'server',
      properties: { bookingReference: 'BK-2' },
    })

    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'booking_completed',
        status: AUDIT_STATUS.REJECTED,
        reasonCode: AUDIT_REASON.SESSION_UNAVAILABLE,
      }),
    )
    expect(analyticsEventCreate).not.toHaveBeenCalled()
  })

  it('writes deduped audit when booking reference already exists', async () => {
    analyticsEventFindFirst.mockResolvedValueOnce({ id: BigInt(9) })

    await recordEvent({
      name: 'booking_completed',
      source: 'server',
      properties: { bookingReference: 'BK-3' },
    })

    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'booking_completed',
        status: AUDIT_STATUS.DEDUPED,
        reasonCode: AUDIT_REASON.DEDUPE_SUPPRESSED,
        bookingReference: 'BK-3',
      }),
    )
    expect(analyticsEventCreate).not.toHaveBeenCalled()
  })

  it('writes a truncation marker and accepted audit for oversized properties', async () => {
    await recordEvent({
      name: 'booking_completed',
      source: 'server',
      properties: {
        bookingReference: 'BK-4',
        payload: 'x'.repeat(9 * 1024),
      },
    })

    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'booking_completed',
        status: AUDIT_STATUS.ACCEPTED,
        reasonCode: AUDIT_REASON.PROPERTIES_TRUNCATED,
      }),
    )
    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'booking_completed',
        status: AUDIT_STATUS.ACCEPTED,
      }),
    )
  })

  it('writes failed audit when analyticsEvent.create fails', async () => {
    analyticsEventCreate.mockRejectedValueOnce(new Error('db unavailable'))

    await expect(
      recordEvent({
        name: 'booking_completed',
        source: 'server',
        properties: { bookingReference: 'BK-5' },
      }),
    ).resolves.toBeUndefined()

    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'booking_completed',
        status: AUDIT_STATUS.FAILED,
        reasonCode: AUDIT_REASON.DB_WRITE_FAILED,
      }),
    )
  })

  it('writes failed recorder exception audit when unexpected error occurs', async () => {
    headersMock.mockRejectedValueOnce(new Error('headers unavailable'))

    await expect(
      recordEvent({
        name: 'booking_completed',
        source: 'server',
        properties: { bookingReference: 'BK-6' },
      }),
    ).resolves.toBeUndefined()

    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'booking_completed',
        status: AUDIT_STATUS.FAILED,
        reasonCode: AUDIT_REASON.RECORDER_EXCEPTION,
      }),
    )
  })
})
