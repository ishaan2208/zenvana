'use client'

import { useEffect, useRef, useState } from 'react'

type Options = {
  /** Minimum visible ratio before firing (0–1) */
  minRatio?: number
  rootMargin?: string
}

/**
 * Fires once when the element has been scrolled into view (not on mere mount peek).
 */
export function useInViewOnce<T extends HTMLElement = HTMLElement>({
  minRatio = 0.4,
  rootMargin = '0px 0px -10% 0px',
}: Options = {}) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        if (entry.intersectionRatio < minRatio) return
        setInView(true)
        observer.disconnect()
      },
      { threshold: [0, minRatio, 0.55, 0.75], rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [inView, minRatio, rootMargin])

  return { ref, inView }
}
