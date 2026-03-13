'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const MULTI_ROOM_STORAGE_KEY = 'zenvana_multi_room_booking'

type StoredPayload = {
  slug: string
  checkIn: string
  checkOut: string
  roomLines: Array<{ occupancy: number }>
}

function buildRoomsUrl(slug: string): string {
  try {
    const raw = sessionStorage.getItem(MULTI_ROOM_STORAGE_KEY)
    if (!raw) return `/book/${slug}/rooms`
    const data = JSON.parse(raw) as StoredPayload
    if (data.slug !== slug || !data.checkIn || !data.checkOut) {
      return `/book/${slug}/rooms`
    }
    const rooms = data.roomLines?.length ?? 1
    const guests =
      data.roomLines?.reduce((sum, l) => sum + (l.occupancy ?? 1), 0) ?? 1
    const params = new URLSearchParams({
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      rooms: String(rooms),
      guests: String(guests),
    })
    return `/book/${slug}/rooms?${params.toString()}`
  } catch {
    return `/book/${slug}/rooms`
  }
}

export function BackToRoomsLink({ slug }: { slug: string }) {
  const [href, setHref] = useState(`/book/${slug}/rooms`)

  useEffect(() => {
    setHref(buildRoomsUrl(slug))
  }, [slug])

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to rooms
    </Link>
  )
}
