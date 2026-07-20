'use client'

import { useEffect, useRef } from 'react'

import { track } from '@/lib/analytics/client'

const MILESTONES = [25, 50, 75, 100] as const

/**
 * Fires blog_read_progress at 25/50/75/100% scroll milestones for a post.
 */
export function BlogReadTracker({
  slug,
  authorName,
}: {
  slug: string
  authorName?: string | null
}) {
  const fired = useRef<Set<number>>(new Set())

  useEffect(() => {
    fired.current = new Set()

    const handle = () => {
      const target = document.getElementById('blog-article')
      const viewportTop = window.scrollY
      const viewportHeight = window.innerHeight

      let progressPct = 0
      if (target) {
        const articleTop = target.offsetTop
        const articleHeight = target.offsetHeight
        const distance = articleHeight - viewportHeight
        if (distance > 0) {
          progressPct = Math.min(
            100,
            Math.max(0, ((viewportTop - articleTop + viewportHeight * 0.25) / distance) * 100),
          )
        } else if (articleHeight > 0) {
          progressPct = 100
        }
      } else {
        const docHeight = document.documentElement.scrollHeight - viewportHeight
        progressPct = docHeight > 0 ? (viewportTop / docHeight) * 100 : 0
      }

      for (const milestone of MILESTONES) {
        if (progressPct >= milestone && !fired.current.has(milestone)) {
          fired.current.add(milestone)
          track('blog_read_progress', {
            slug,
            authorName: authorName ?? null,
            percent: milestone,
          })
        }
      }
    }

    handle()
    window.addEventListener('scroll', handle, { passive: true })
    window.addEventListener('resize', handle)
    return () => {
      window.removeEventListener('scroll', handle)
      window.removeEventListener('resize', handle)
    }
  }, [slug, authorName])

  return null
}
