import { NextResponse } from 'next/server'

import { getPublicBookingsCount } from '@/lib/api'

/**
 * Public proxy that returns the live bookings count for a given user/owner.
 *
 *   GET /api/public/bookings-count?userId=1
 *   → { count: number | null }
 *
 * Why this exists rather than letting the client hit the backend directly:
 *
 * 1. Server-side caching — `getPublicBookingsCount` uses `next: { revalidate: 60 }`,
 *    so all concurrent visitors on the same instance share a single backend call
 *    per minute instead of every viewer firing their own request.
 * 2. Backend URL stays server-side; we don't expose `NEXT_PUBLIC_BACKEND_URL`
 *    pattern coupling to the homepage component.
 * 3. We can shape the response (clamp, anonymize, etc.) here later without
 *    touching the client component.
 *
 * Read-only. No business logic touched.
 */
export const revalidate = 60

export async function GET(request: Request) {
  const url = new URL(request.url)
  const userIdRaw = url.searchParams.get('userId')
  const userId = Number(userIdRaw)

  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json(
      { error: 'invalid userId' },
      { status: 400 },
    )
  }

  const count = await getPublicBookingsCount(userId)

  return NextResponse.json(
    { count, userId },
    {
      // Edge-cache via CDN where available (Vercel honors this).
      // s-maxage = shared cache TTL, stale-while-revalidate = serve stale
      // while triggering a refresh in the background.
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    },
  )
}
