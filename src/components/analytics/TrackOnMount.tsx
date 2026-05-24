'use client'

import { useEffect, useRef } from 'react'

import { track } from '@/lib/analytics/client'

type Props = {
  name: string
  properties?: Record<string, unknown>
  propertySlug?: string | null
  /** Optional dedupe key — if it changes, fire again. */
  dedupeKey?: string
}

export function TrackOnMount({ name, properties, propertySlug, dedupeKey }: Props) {
  const firedFor = useRef<string | null>(null)
  const key = dedupeKey ?? `${name}:once`

  useEffect(() => {
    if (firedFor.current === key) return
    firedFor.current = key
    track(name, properties, propertySlug ?? null)
  }, [key, name, properties, propertySlug])

  return null
}
