import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  cookiesMock,
  headersMock,
  analyticsSessionFindUnique,
  analyticsSessionCreate,
  analyticsSessionUpdate,
  analyticsEventFindFirst,
  analyticsEventCreate,
  analyticsEventFindMany,
  analyticsEventCreateMany,
  writeAnalyticsAudit,
  AUDIT_STATUS,
  AUDIT_REASON,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  headersMock: vi.fn(),
  analyticsSessionFindUnique: vi.fn(),
  analyticsSessionCreate: vi.fn(),
  analyticsSessionUpdate: vi.fn(),
  analyticsEventFindFirst: vi.fn(),
  analyticsEventCreate: vi.fn(),
  analyticsEventFindMany: vi.fn(),
  analyticsEventCreateMany: vi.fn(),
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
    EVENT_RECORDED: 'EVENT_RECORDED',
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
      findUnique: analyticsSessionFindUnique,
      create: analyticsSessionCreate,
      update: analyticsSessionUpdate,
    },
    analyticsEvent: {
      findFirst: analyticsEventFindFirst,
      create: analyticsEventCreate,
      findMany: analyticsEventFindMany,
      createMany: analyticsEventCreateMany,
    },
  },
}))

vi.mock('@/lib/analytics/audit', () => ({
  writeAnalyticsAudit,
  AUDIT_STATUS,
  AUDIT_REASON,
}))

import { ANON_SESSION_COOKIE, recordEvent, recordEventsBatch } from '@/lib/analytics/recorder'

function setupRequestContext(options?: {
  sessionId?: string | null
  userAgent?: string | null
  allowCookieSet?: boolean
}) {
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
    analyticsSessionFindUnique.mockResolvedValue({
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'brand',
      channel: 'google-ads',
      lastUtmSource: null,
      lastUtmCampaign: null,
    })
    analyticsSessionCreate.mockResolvedValue({})
    analyticsSessionUpdate.mockResolvedValue({})
    analyticsEventFindFirst.mockResolvedValue(null)
    analyticsEventCreate.mockResolvedValue({ id: BigInt(1) })
    analyticsEventFindMany.mockResolvedValue([])
    analyticsEventCreateMany.mockResolvedValue({ count: 1 })
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

  it('uses a synthetic session when cookies are read-only (never drops bookings)', async () => {
    setupRequestContext({ sessionId: null, allowCookieSet: false })
    analyticsSessionFindUnique.mockResolvedValue(null)

    await recordEvent({
      name: 'booking_completed',
      source: 'server',
      properties: { bookingReference: 'BK-2' },
    })

    expect(analyticsSessionCreate).toHaveBeenCalled()
    expect(analyticsEventCreate).toHaveBeenCalled()
    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'booking_completed',
        status: AUDIT_STATUS.ACCEPTED,
        reasonCode: AUDIT_REASON.EVENT_RECORDED,
      }),
    )
  })

  it('denormalizes session UTM onto the event', async () => {
    await recordEvent({
      name: 'page_viewed',
      source: 'client',
      properties: { path: '/' },
    })

    expect(analyticsEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          utmSource: 'google',
        }),
      }),
    )
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

    expect(writeAnalyticsAudit).toHaveBeenCalledTimes(2)
    expect(writeAnalyticsAudit).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        eventName: 'booking_completed',
        status: AUDIT_STATUS.ACCEPTED,
        reasonCode: AUDIT_REASON.PROPERTIES_TRUNCATED,
      }),
    )
    expect(writeAnalyticsAudit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        eventName: 'booking_completed',
        status: AUDIT_STATUS.ACCEPTED,
        reasonCode: AUDIT_REASON.EVENT_RECORDED,
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

describe('recordEventsBatch audit instrumentation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupRequestContext()
    analyticsSessionFindUnique.mockResolvedValue({
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      channel: 'direct',
      lastUtmSource: null,
      lastUtmCampaign: null,
    })
    analyticsSessionCreate.mockResolvedValue({})
    analyticsSessionUpdate.mockResolvedValue({})
    analyticsEventFindMany.mockResolvedValue([])
    analyticsEventCreateMany.mockResolvedValue({ count: 1 })
    writeAnalyticsAudit.mockResolvedValue(undefined)
  })

  it('writes rejected audit when all batch events are invalid', async () => {
    await recordEventsBatch([
      { name: 'not_real_1', source: 'client' },
      { name: 'not_real_2', source: 'server' },
    ])

    expect(writeAnalyticsAudit).toHaveBeenCalledTimes(1)
    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'batch',
        source: 'system',
        status: AUDIT_STATUS.REJECTED,
        reasonCode: AUDIT_REASON.INVALID_EVENT_NAME,
      }),
    )
    expect(analyticsEventCreateMany).not.toHaveBeenCalled()
  })

  it('writes rejected audit when batch user-agent is filtered as bot', async () => {
    setupRequestContext({ userAgent: 'Googlebot/2.1' })

    await expect(
      recordEventsBatch([
        { name: 'page_viewed', source: 'client' },
        { name: 'booking_completed', source: 'server', properties: { bookingReference: 'BK-BOT' } },
      ]),
    ).resolves.toBeUndefined()

    expect(writeAnalyticsAudit).toHaveBeenCalledTimes(1)
    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'batch',
        source: 'system',
        status: AUDIT_STATUS.REJECTED,
        reasonCode: AUDIT_REASON.BOT_FILTERED,
      }),
    )
    expect(analyticsEventCreateMany).not.toHaveBeenCalled()
  })

  it('uses synthetic session for batch when cookies are read-only', async () => {
    setupRequestContext({ sessionId: null, allowCookieSet: false })
    analyticsSessionFindUnique.mockResolvedValue(null)

    await expect(
      recordEventsBatch([
        { name: 'page_viewed', source: 'client' },
        {
          name: 'booking_completed',
          source: 'server',
          properties: { bookingReference: 'BK-SESSION' },
        },
      ]),
    ).resolves.toBeUndefined()

    expect(analyticsEventCreateMany).toHaveBeenCalled()
    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'batch',
        source: 'system',
        status: AUDIT_STATUS.ACCEPTED,
        reasonCode: AUDIT_REASON.EVENT_RECORDED,
      }),
    )
  })

  it('writes failed audit when batch createMany write fails', async () => {
    analyticsEventCreateMany.mockRejectedValueOnce(new Error('batch db down'))

    await expect(
      recordEventsBatch([
        { name: 'page_viewed', source: 'client' },
        {
          name: 'booking_completed',
          source: 'server',
          properties: { bookingReference: 'BK-DBFAIL' },
        },
      ]),
    ).resolves.toBeUndefined()

    expect(writeAnalyticsAudit).toHaveBeenCalledTimes(1)
    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'batch',
        source: 'system',
        status: AUDIT_STATUS.FAILED,
        reasonCode: AUDIT_REASON.DB_WRITE_FAILED,
      }),
    )
  })

  it('writes outer exception fallback audit when batch throws unexpectedly', async () => {
    headersMock.mockRejectedValueOnce(new Error('headers unavailable'))

    await expect(
      recordEventsBatch([{ name: 'page_viewed', source: 'client' }]),
    ).resolves.toBeUndefined()

    expect(writeAnalyticsAudit).toHaveBeenCalledTimes(1)
    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'batch',
        source: 'system',
        status: AUDIT_STATUS.FAILED,
        reasonCode: AUDIT_REASON.RECORDER_EXCEPTION,
      }),
    )
  })

  it('writes all-deduped summary and returns early', async () => {
    analyticsEventFindMany.mockResolvedValueOnce([{ bookingReference: 'BK-DEDUP-1' }])

    await expect(
      recordEventsBatch([
        {
          name: 'booking_completed',
          source: 'server',
          properties: { bookingReference: 'BK-DEDUP-1' },
        },
      ]),
    ).resolves.toBeUndefined()

    expect(analyticsEventCreateMany).not.toHaveBeenCalled()
    expect(writeAnalyticsAudit).toHaveBeenCalledTimes(1)
    expect(writeAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'batch',
        source: 'system',
        status: AUDIT_STATUS.DEDUPED,
        reasonCode: AUDIT_REASON.DEDUPE_SUPPRESSED,
      }),
    )
  })

  it('writes truncation marker then accepted summary for oversized batch payload', async () => {
    await expect(
      recordEventsBatch([
        {
          name: 'booking_completed',
          source: 'server',
          properties: {
            bookingReference: 'BK-TRUNC',
            payload: 'x'.repeat(9 * 1024),
          },
        },
      ]),
    ).resolves.toBeUndefined()

    expect(analyticsEventCreateMany).toHaveBeenCalledTimes(1)
    expect(writeAnalyticsAudit).toHaveBeenCalledTimes(2)
    expect(writeAnalyticsAudit).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        eventName: 'batch',
        source: 'system',
        status: AUDIT_STATUS.ACCEPTED,
        reasonCode: AUDIT_REASON.PROPERTIES_TRUNCATED,
      }),
    )
    expect(writeAnalyticsAudit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        eventName: 'batch',
        source: 'system',
        status: AUDIT_STATUS.ACCEPTED,
        reasonCode: AUDIT_REASON.EVENT_RECORDED,
      }),
    )
  })

  it('writes dedupe summary and accepted summary for mixed batch outcomes', async () => {
    analyticsEventFindMany.mockResolvedValueOnce([{ bookingReference: 'BK-EXISTING' }])

    await expect(
      recordEventsBatch([
        {
          name: 'booking_completed',
          source: 'server',
          properties: { bookingReference: 'BK-EXISTING' },
        },
        {
          name: 'booking_completed',
          source: 'client',
          properties: { bookingReference: 'BK-NEW' },
        },
      ]),
    ).resolves.toBeUndefined()

    expect(analyticsEventCreateMany).toHaveBeenCalledTimes(1)
    expect(writeAnalyticsAudit).toHaveBeenCalledTimes(2)
    expect(writeAnalyticsAudit).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        eventName: 'batch',
        source: 'system',
        status: AUDIT_STATUS.DEDUPED,
        reasonCode: AUDIT_REASON.DEDUPE_SUPPRESSED,
      }),
    )
    expect(writeAnalyticsAudit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        eventName: 'batch',
        source: 'system',
        status: AUDIT_STATUS.ACCEPTED,
        reasonCode: AUDIT_REASON.EVENT_RECORDED,
      }),
    )
  })
})
