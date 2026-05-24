import { describe, expect, it } from 'vitest'

import { ANALYTICS_EVENT_NAMES, isAnalyticsEventName } from '@/lib/analytics/events'

describe('analytics smoke', () => {
  it('exposes expected event definitions', () => {
    expect(ANALYTICS_EVENT_NAMES.length).toBeGreaterThan(0)
    expect(new Set(ANALYTICS_EVENT_NAMES).size).toBe(ANALYTICS_EVENT_NAMES.length)
    expect(ANALYTICS_EVENT_NAMES).toContain('page_viewed')
    expect(isAnalyticsEventName('booking_completed')).toBe(true)
    expect(isAnalyticsEventName('not_a_real_event')).toBe(false)
  })
})
