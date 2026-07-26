export const ANALYTICS_EVENT_NAMES = [
  'page_viewed',
  'property_viewed',
  'dates_selected',
  'availability_checked',
  'room_selected',
  'checkout_viewed',
  'coupon_applied',
  'coupon_failed',
  'payment_initiated',
  'payment_failed',
  'price_changed',
  'booking_completed',
  'cta_clicked',
  'whatsapp_clicked',
  'campaign_touch',
  'blog_post_viewed',
  'blog_read_progress',
  'blog_cta_clicked',
  'blog_comment_submitted',
  'newsletter_subscribed',
] as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number]

const ANALYTICS_EVENT_NAME_SET: ReadonlySet<string> = new Set(ANALYTICS_EVENT_NAMES)

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return ANALYTICS_EVENT_NAME_SET.has(value)
}
