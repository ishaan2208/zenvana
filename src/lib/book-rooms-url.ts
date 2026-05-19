/** True when path is `/book/<slug>/rooms` (with or without query). */
export function isBookRoomsPath(path: string): boolean {
  const pathname = path.split('?')[0] ?? path
  return /^\/book\/[^/]+\/rooms\/?$/.test(pathname)
}

export type BookRoomsUrlParams = {
  slug: string
  checkIn: string
  checkOut: string
  rooms: number
  totalGuests: number
  guestsPerRoom?: number
  couponCode?: string
}

export function buildBookRoomsPath({
  slug,
  checkIn,
  checkOut,
  rooms,
  totalGuests,
  guestsPerRoom,
  couponCode,
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

  return `/book/${slug}/rooms?${params.toString()}`
}
