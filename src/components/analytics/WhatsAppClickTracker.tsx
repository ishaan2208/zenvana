'use client'

import { useEffect } from 'react'

import { track } from '@/lib/analytics/client'
import { pushDataLayerEvent } from '@/lib/analytics/gtm'

function isWhatsAppHref(href: string): boolean {
  try {
    const url = new URL(href, window.location.origin)
    const host = url.hostname.toLowerCase()
    return (
      host === 'wa.me' ||
      host === 'api.whatsapp.com' ||
      host === 'web.whatsapp.com' ||
      host.endsWith('.whatsapp.com')
    )
  } catch {
    return /wa\.me|whatsapp\.com/i.test(href)
  }
}

/**
 * Site-wide WhatsApp click tracker (wa.me / api.whatsapp.com).
 * Complements PhoneCallTracker for outbound intent signals.
 */
export function WhatsAppClickTracker() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Element | null
      const link = target?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link) return

      const href = link.getAttribute('href') ?? ''
      if (!href || !isWhatsAppHref(href)) return

      const label = (link.textContent ?? '').trim().slice(0, 120) || undefined
      const pagePath = window.location.pathname + (window.location.search || '')

      pushDataLayerEvent({
        event: 'whatsapp_click',
        link_href: href.slice(0, 500),
        link_label: label,
        page_path: pagePath,
      })

      track('whatsapp_clicked', {
        href: href.slice(0, 500),
        label,
        page_path: pagePath,
        placement: link.dataset.analyticsPlacement ?? 'link',
      })
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return null
}
