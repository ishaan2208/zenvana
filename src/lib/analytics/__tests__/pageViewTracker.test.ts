import { describe, expect, it } from 'vitest'

import { shouldTrackPath } from '@/components/analytics/PageViewTracker'

describe('shouldTrackPath', () => {
  it('skips internal routes', () => {
    expect(shouldTrackPath('/internal/analytics')).toBe(false)
  })

  it('skips api routes', () => {
    expect(shouldTrackPath('/api/track')).toBe(false)
  })

  it('tracks public routes', () => {
    expect(shouldTrackPath('/hotels')).toBe(true)
  })
})
