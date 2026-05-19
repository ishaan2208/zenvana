'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Prefetches `/book/<slug>/rooms` when `roomsUrl` is set. Dedupes by full URL string.
 */
export function usePrefetchBookRooms(roomsUrl: string | null) {
  const router = useRouter()
  const lastPrefetchedRef = useRef<string | null>(null)

  const prefetchRooms = useCallback(() => {
    if (!roomsUrl || roomsUrl === lastPrefetchedRef.current) return
    lastPrefetchedRef.current = roomsUrl
    router.prefetch(roomsUrl)
  }, [roomsUrl, router])

  useEffect(() => {
    prefetchRooms()
  }, [prefetchRooms])

  return { prefetchRooms }
}
