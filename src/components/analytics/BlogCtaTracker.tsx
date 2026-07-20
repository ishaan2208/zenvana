'use client'

import { useEffect } from 'react'

import { track } from '@/lib/analytics/client'

/**
 * On blog post pages, clicks to /hotels/* or /book/* fire blog_cta_clicked
 * so we can measure blog-assisted funnel entry.
 */
export function BlogCtaTracker({
  slug,
  authorName,
}: {
  slug: string
  authorName?: string | null
}) {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Element | null
      const link = target?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link) return

      const href = link.getAttribute('href') ?? ''
      if (!href) return

      let pathname = href
      try {
        pathname = new URL(href, window.location.origin).pathname
      } catch {
        /* relative path */
      }

      const isHotel = pathname.startsWith('/hotels/')
      const isBook = pathname.startsWith('/book/')
      if (!isHotel && !isBook) return

      const propertySlug = pathname.split('/').filter(Boolean)[1] ?? null

      track(
        'blog_cta_clicked',
        {
          slug,
          authorName: authorName ?? null,
          href: href.slice(0, 500),
          targetPath: pathname,
          destination: isBook ? 'booking' : 'hotel',
        },
        propertySlug,
      )
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [slug, authorName])

  return null
}
