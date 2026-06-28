/** True when path is `/book/<slug>/rooms` (with or without query). */
export function isBookRoomsPath(path: string): boolean {
  const pathname = path.split('?')[0] ?? path
  return /^\/book\/[^/]+\/rooms\/?$/.test(pathname)
}

/** Routes that render dedicated `loading.tsx` skeletons (skip global nav overlay). */
export function isBookFlowSkeletonPath(path: string): boolean {
  const pathname = path.split('?')[0] ?? path
  if (/^\/book\/[^/]+\/rooms\/?$/.test(pathname)) return true
  if (/^\/book\/[^/]+\/checkout\/?$/.test(pathname)) return true
  if (/^\/book\/[^/]+\/?$/.test(pathname)) return true
  if (/^\/booking\/confirmation\/?$/.test(pathname)) return true
  if (/^\/hotels\/[^/]+\/?$/.test(pathname)) return true
  return false
}

export type BookRoomsUrlParams = {
  slug: string
  checkIn: string
  checkOut: string
  rooms: number
  totalGuests: number
  guestsPerRoom?: number
  couponCode?: string
  /** Internal path only — used by room selection back navigation. */
  returnTo?: string
}

/** Allow same-origin relative paths only (blocks open redirects). */
export function sanitizeReturnTo(value: string | undefined | null): string | null {
  if (!value) return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  if (value.includes('://')) return null
  return value
}

export function buildBookRoomsPath({
  slug,
  checkIn,
  checkOut,
  rooms,
  totalGuests,
  guestsPerRoom,
  couponCode,
  returnTo,
}: BookRoomsUrlParams): string {
  const params = new URLSearchParams({
    checkIn,
    checkOut,
    rooms: String(rooms),
    guests: String(totalGuests),
  })

  if (guestsPerRoom != null) {
    params.set('guestsPerRoom', String(guestsPerRoom))
  }
  if (couponCode) {
    params.set('couponCode', couponCode)
  }
  const safeReturnTo = sanitizeReturnTo(returnTo)
  if (safeReturnTo) {
    params.set('returnTo', safeReturnTo)
  }

  return `/book/${slug}/rooms?${params.toString()}`
}
