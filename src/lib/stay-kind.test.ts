import { describe, expect, it } from 'vitest'

import { DAY_USE_STAY_KIND_PARAM, isDayUseParam } from './stay-kind'

describe('isDayUseParam', () => {
  it('accepts the new dayuse value', () => {
    expect(isDayUseParam('dayuse')).toBe(true)
    expect(isDayUseParam(DAY_USE_STAY_KIND_PARAM)).toBe(true)
  })

  it('accepts the legacy hourly value', () => {
    expect(isDayUseParam('hourly')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isDayUseParam('DayUse')).toBe(true)
    expect(isDayUseParam('HOURLY')).toBe(true)
  })

  it('takes the first entry of repeated params', () => {
    expect(isDayUseParam(['hourly', 'nonsense'])).toBe(true)
    expect(isDayUseParam(['nonsense', 'hourly'])).toBe(false)
  })

  it('rejects everything else', () => {
    expect(isDayUseParam('overnight')).toBe(false)
    expect(isDayUseParam('')).toBe(false)
    expect(isDayUseParam(undefined)).toBe(false)
    expect(isDayUseParam(null)).toBe(false)
  })
})
