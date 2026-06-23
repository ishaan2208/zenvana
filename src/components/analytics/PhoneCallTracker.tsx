'use client'

import { useEffect } from 'react'

import { track } from '@/lib/analytics/client'
import { pushDataLayerEvent } from '@/lib/analytics/gtm'

/**
 * Site-wide phone-call conversion tracker.
 *
 * `tel:` links live in ~15 places across the app, so rather than wrapping each
 * one we delegate a single click listener on the document. Any click that lands
 * on (or inside) an `<a href="tel:...">` pushes a `phone_call_click` event to
 * the GTM dataLayer — wire this to a Google Ads phone-call conversion in GTM —
 * and records a first-party `cta_clicked` event for internal analytics.
 */
export function PhoneCallTracker() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Element | null
      const link = target?.closest?.('a[href^="tel:"]') as HTMLAnchorElement | null
      if (!link) return

      const href = link.getAttribute('href') ?? ''
      const phoneNumber = href.replace(/^tel:/i, '').trim()
      if (!phoneNumber) return

      const label = (link.textContent ?? '').trim().slice(0, 120) || undefined
      const pagePath =
        window.location.pathname + (window.location.search || '')

      pushDataLayerEvent({
        event: 'phone_call_click',
        phone_number: phoneNumber,
        link_label: label,
        page_path: pagePath,
      })

      track('cta_clicked', {
        type: 'phone_call',
        placement: 'tel_link',
        phone_number: phoneNumber,
        label,
        page_path: pagePath,
      })
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return null
}
