import { describe, it, expect } from 'vitest'
import {
  buildHourlyStartTimeOptions,
  earliestBookableStartMinutes,
  istYmd,
} from './hourly-start-times'

describe('buildHourlyStartTimeOptions', () => {
  it('drops starts that cannot finish before windowEnd', () => {
    const opts = buildHourlyStartTimeOptions({
      windowStart: '10:00',
      windowEnd: '22:00',
      durationHours: 3,
      dateYmd: '2099-01-15',
      now: new Date('2099-01-15T04:00:00.000Z'),
    })
    expect(opts[0]).toBe('10:00')
    expect(opts).toContain('19:00')
    expect(opts).not.toContain('20:00')
    expect(opts).not.toContain('21:00')
  })

  it('for today drops starts already in the past (IST)', () => {
    // 15:10 IST = 09:40 UTC
    const now = new Date('2026-07-14T09:40:00.000Z')
    expect(istYmd(now)).toBe('2026-07-14')
    const earliest = earliestBookableStartMinutes('2026-07-14', now)
    expect(earliest).toBe(15 * 60 + 30) // ceil(15:11 → 15:30)

    const opts = buildHourlyStartTimeOptions({
      windowStart: '10:00',
      windowEnd: '21:00',
      durationHours: 3,
      dateYmd: '2026-07-14',
      now,
    })
    expect(opts).not.toContain('10:00')
    expect(opts).not.toContain('15:00')
    expect(opts[0]).toBe('15:30')
    expect(opts).toContain('18:00')
    expect(opts).not.toContain('19:00') // 19+3h > 21:00
  })
})
