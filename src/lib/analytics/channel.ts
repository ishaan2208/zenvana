/**
 * Derive a first-party acquisition channel from UTM params, ad click IDs,
 * and the referrer host. Used at session create / last-touch update time.
 */

export type ChannelInput = {
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  gclid?: string | null
  fbclid?: string | null
  wbraid?: string | null
  msclkid?: string | null
  referrer?: string | null
}

const ORGANIC_SEARCH_HOSTS = [
  'google.',
  'bing.',
  'duckduckgo.',
  'yahoo.',
  'yandex.',
  'baidu.',
]

const SOCIAL_HOSTS: Array<{ match: string; channel: string }> = [
  { match: 'facebook.', channel: 'meta' },
  { match: 'fb.com', channel: 'meta' },
  { match: 'instagram.', channel: 'instagram' },
  { match: 'l.instagram.', channel: 'instagram' },
  { match: 'twitter.', channel: 'twitter' },
  { match: 'x.com', channel: 'twitter' },
  { match: 't.co', channel: 'twitter' },
  { match: 'linkedin.', channel: 'linkedin' },
  { match: 'youtube.', channel: 'youtube' },
  { match: 'youtu.be', channel: 'youtube' },
]

function hostFromReferrer(referrer: string | null | undefined): string | null {
  if (!referrer) return null
  try {
    return new URL(referrer).hostname.toLowerCase()
  } catch {
    return null
  }
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n))
}

/**
 * Returns a stable channel slug used for dashboards and rollups.
 * Examples: whatsapp | google-ads | google-organic | meta | instagram |
 * email | direct | referral | bing-ads | other-paid | other
 */
export function deriveChannel(input: ChannelInput): string {
  const source = (input.utmSource ?? '').trim().toLowerCase()
  const medium = (input.utmMedium ?? '').trim().toLowerCase()
  const host = hostFromReferrer(input.referrer)

  // Paid click IDs win even without UTM.
  if (input.gclid || input.wbraid) return 'google-ads'
  if (input.msclkid) return 'bing-ads'
  if (input.fbclid) return 'meta'

  if (source || medium) {
    if (
      source.includes('whatsapp') ||
      medium.includes('whatsapp') ||
      medium.includes('interakt') ||
      source === 'wa'
    ) {
      return 'whatsapp'
    }
    if (source.includes('instagram') || medium.includes('instagram') || source === 'ig') {
      return 'instagram'
    }
    if (
      source.includes('facebook') ||
      source === 'fb' ||
      source.includes('meta') ||
      medium.includes('facebook')
    ) {
      return 'meta'
    }
    if (
      medium === 'cpc' ||
      medium === 'ppc' ||
      medium === 'paid' ||
      medium === 'paidsearch' ||
      medium.includes('paid_search')
    ) {
      if (source.includes('google')) return 'google-ads'
      if (source.includes('bing')) return 'bing-ads'
      return 'other-paid'
    }
    if (medium === 'email' || source.includes('email') || source.includes('newsletter')) {
      return 'email'
    }
    if (medium === 'organic' || medium === 'seo') {
      if (source.includes('google')) return 'google-organic'
      return 'organic'
    }
    if (medium === 'social') {
      if (source.includes('instagram')) return 'instagram'
      if (source.includes('facebook') || source === 'fb') return 'meta'
      if (source.includes('twitter') || source === 'x') return 'twitter'
      if (source.includes('linkedin')) return 'linkedin'
      return 'social'
    }
    if (medium === 'referral') return 'referral'
    if (source.includes('google')) return 'google-organic'
  }

  if (host) {
    if (includesAny(host, ORGANIC_SEARCH_HOSTS)) {
      if (host.includes('google')) return 'google-organic'
      if (host.includes('bing')) return 'bing-organic'
      return 'organic'
    }
    for (const entry of SOCIAL_HOSTS) {
      if (host.includes(entry.match)) return entry.channel
    }
    // Same-site referrer (internal nav) → treat as direct continuation
    if (host.includes('zenvana')) return 'direct'
    return 'referral'
  }

  return 'direct'
}

export function friendlyChannel(channel: string | null | undefined): string {
  if (!channel || channel === 'direct') return 'Direct'
  const map: Record<string, string> = {
    whatsapp: 'WhatsApp / Interakt',
    'google-ads': 'Google Ads',
    'google-organic': 'Google Organic',
    'bing-ads': 'Bing Ads',
    'bing-organic': 'Bing Organic',
    meta: 'Meta (Facebook)',
    instagram: 'Instagram',
    twitter: 'Twitter / X',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    email: 'Email / Newsletter',
    organic: 'Organic Search',
    social: 'Social',
    referral: 'Referral',
    'other-paid': 'Other Paid',
    other: 'Other',
  }
  return map[channel] ?? channel.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function hasCampaignSignals(input: ChannelInput): boolean {
  return Boolean(
    input.utmSource ||
      input.utmMedium ||
      input.utmCampaign ||
      input.gclid ||
      input.fbclid ||
      input.wbraid ||
      input.msclkid,
  )
}
