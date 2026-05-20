'use client'

import { useEffect, useRef } from 'react'

/**
 * Slim top-of-page reading progress bar. Listens for scroll on `window`
 * and transforms a fixed bar — cheap, GPU-friendly, no re-renders.
 */
export function ReadingProgress({ targetId = 'blog-article' }: { targetId?: string }) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return

    const handle = () => {
      const target = document.getElementById(targetId)
      const viewportTop = window.scrollY
      const viewportHeight = window.innerHeight

      let progress = 0
      if (target) {
        const articleTop = target.offsetTop
        const articleHeight = target.offsetHeight
        const distance = articleHeight - viewportHeight
        if (distance > 0) {
          progress = Math.min(1, Math.max(0, (viewportTop - articleTop + viewportHeight * 0.25) / distance))
        }
      } else {
        const docHeight = document.documentElement.scrollHeight - viewportHeight
        progress = docHeight > 0 ? viewportTop / docHeight : 0
      }
      bar.style.transform = `scaleX(${progress})`
    }

    handle()
    window.addEventListener('scroll', handle, { passive: true })
    window.addEventListener('resize', handle)
    return () => {
      window.removeEventListener('scroll', handle)
      window.removeEventListener('resize', handle)
    }
  }, [targetId])

  return <div ref={barRef} className="reading-progress" aria-hidden="true" />
}
