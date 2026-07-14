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

export type BookHourlyRoomsUrlParams = {
  slug: string
  date: string
  startTime: string
  durationHours: number
  guests?: number
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

/** Next calendar day YYYY-MM-DD from a YYYY-MM-DD string (local arithmetic). */
export function nextCalendarYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + 1)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function buildBookHourlyRoomsPath({
  slug,
  date,
  startTime,
  durationHours,
  guests = 2,
  returnTo,
}: BookHourlyRoomsUrlParams): string {
  const params = new URLSearchParams({
    stayKind: 'hourly',
    date,
    startTime,
    durationHours: String(durationHours),
    checkIn: date,
    checkOut: nextCalendarYmd(date),
    rooms: '1',
    guests: String(guests),
  })
  const safeReturnTo = sanitizeReturnTo(returnTo)
  if (safeReturnTo) {
    params.set('returnTo', safeReturnTo)
  }
  return `/book/${slug}/rooms?${params.toString()}`
}
