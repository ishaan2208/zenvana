import { describe, expect, it } from 'vitest'

import { deriveChannel, friendlyChannel, hasCampaignSignals } from '@/lib/analytics/channel'

describe('deriveChannel', () => {
  it('maps Interakt WhatsApp UTMs to whatsapp', () => {
    expect(
      deriveChannel({
        utmSource: 'whatsapp',
        utmMedium: 'interakt',
        utmCampaign: 'summer_sale',
      }),
    ).toBe('whatsapp')
  })

  it('maps gclid to google-ads', () => {
    expect(deriveChannel({ gclid: 'abc123' })).toBe('google-ads')
  })

  it('maps fbclid to meta', () => {
    expect(deriveChannel({ fbclid: 'xyz' })).toBe('meta')
  })

  it('maps google organic referrer', () => {
    expect(deriveChannel({ referrer: 'https://www.google.com/search?q=zenvana' })).toBe(
      'google-organic',
    )
  })

  it('returns direct when empty', () => {
    expect(deriveChannel({})).toBe('direct')
  })

  it('friendly labels', () => {
    expect(friendlyChannel('whatsapp')).toContain('WhatsApp')
    expect(hasCampaignSignals({ utmSource: 'x' })).toBe(true)
    expect(hasCampaignSignals({})).toBe(false)
  })
})
