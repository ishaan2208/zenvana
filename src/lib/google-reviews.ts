/**
 * Server-only Google reviews aggregator for the Zenvana homepage.
 *
 * Reads cached reviews + aggregate ratings from the backend public API
 * (populated daily by the google-ratings-snapshot cron). No direct Google
 * Places API calls from zenvana — fails open to static testimonials when
 * the backend is unavailable or returns no data.
 */

const REVALIDATE_SECONDS = 60 * 60 // 1 hour — backend cron refreshes daily

function getBackendBase(): string {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
  const trimmed = base.replace(/\/$/, '')
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`
}

export type GoogleReview = {
  authorName: string
  authorPhotoUrl?: string
  rating: number
  text: string
  relativeTime: string
  language?: string
  sourcePlaceName?: string
}

export type AggregatedReviews = {
  reviews: GoogleReview[]
  ratingValue: number
  reviewCount: number
  /** Per-place breakdown — useful for showing source attribution. */
  sources: Array<{
    placeId?: string
    placeName?: string
    rating: number
    reviewCount: number
  }>
}

type BackendGoogleReviewsResponse = {
  ok?: boolean
  data?: AggregatedReviews
}

async function fetchCachedGoogleReviews(totalLimit: number): Promise<AggregatedReviews | null> {
  const url = `${getBackendBase()}/public/google-reviews?limit=${totalLimit}`
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } })
    if (!res.ok) return null
    const json = (await res.json()) as BackendGoogleReviewsResponse
    if (!json.ok || !json.data) return null
    if (json.data.reviews.length === 0 && json.data.sources.length === 0) return null
    return json.data
  } catch {
    return null
  }
}

/** @deprecated Place IDs are resolved by the backend cron; kept for API compatibility. */
export function resolvePlaceIds(explicit?: string[]): string[] {
  return explicit?.filter(Boolean) ?? []
}

/**
 * Fetch + aggregate reviews from the backend cache. Returns `null` if the
 * backend is unavailable or has no data — callers should render their static
 * fallback in that case.
 */
export async function getAggregatedReviews({
  totalLimit = 9,
  minRating: _minRating = 4,
}: {
  placeIds?: string[]
  perPlaceLimit?: number
  totalLimit?: number
  minRating?: number
} = {}): Promise<AggregatedReviews | null> {
  void _minRating
  return fetchCachedGoogleReviews(totalLimit)
}

export function isGoogleReviewsConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_BACKEND_URL
}
