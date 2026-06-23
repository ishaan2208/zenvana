type DataLayerEvent = Record<string, unknown> & { event: string }

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[]
  }
}

/**
 * Push a structured event onto the GTM dataLayer.
 *
 * GTM is loaded via SiteAnalytics (NEXT_PUBLIC_GTM_ID). Conversions for these
 * events (e.g. `phone_call_click`, `booking_confirmed`) are configured as
 * tags/triggers inside the GTM dashboard — no Google Ads labels live in code.
 *
 * Safe to call from any client component; no-ops on the server or before GTM
 * has initialised the dataLayer.
 */
export function pushDataLayerEvent(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(event)
}
