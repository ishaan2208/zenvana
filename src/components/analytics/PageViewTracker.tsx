'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

import { track } from '@/lib/analytics/client'

const DEBOUNCE_MS = 300
const IGNORED_PREFIXES = ['/internal', '/api']

export function shouldTrackPath(pathname: string | null): boolean {
  if (!pathname) return false
  return !IGNORED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastPathRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!shouldTrackPath(pathname)) return
    const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    if (lastPathRef.current === fullPath) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      lastPathRef.current = fullPath
      track('page_viewed', { path: fullPath })
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pathname, searchParams])

  return null
}
