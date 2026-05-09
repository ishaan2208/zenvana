/**
 * Server-only Google Places review aggregator.
 *
 * Pulls top reviews + aggregate rating from one or more Google Place IDs and
 * caches the result for 24 hours. Designed to fail open: if no API key /
 * Place ID is configured, or the API call fails, callers receive `null` and
 * fall back to the static testimonials hard-coded into the homepage.
 *
 * Env (server-only — never expose this key to the browser):
 *   GOOGLE_PLACES_API_KEY=AIza...
 *
 * Per-property Place IDs may be passed at the call site; configure them as
 * a comma-separated list via env if you prefer:
 *   GOOGLE_PLACE_IDS=ChIJxxxxxxxxx,ChIJyyyyyyyyy
 */

// Server-only: this module reads non-public env vars and must never reach the
// client bundle. Treat it as such — only import from server components.

const API_KEY = process.env.GOOGLE_PLACES_API_KEY
const ENV_PLACE_IDS = (process.env.GOOGLE_PLACE_IDS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const REVALIDATE_SECONDS = 60 * 60 * 24 // 24 hours

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
    placeId: string
    placeName?: string
    rating: number
    reviewCount: number
  }>
}

type PlaceDetailsResponse = {
  status?: string
  result?: {
    name?: string
    rating?: number
    user_ratings_total?: number
    reviews?: Array<{
      author_name?: string
      profile_photo_url?: string
      rating?: number
      text?: string
      relative_time_description?: string
      language?: string
    }>
  }
  error_message?: string
}

async function fetchPlaceDetails(placeId: string): Promise<PlaceDetailsResponse | null> {
  if (!API_KEY) return null
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'name,rating,user_ratings_total,reviews',
    key: API_KEY,
    reviews_sort: 'newest',
    language: 'en',
  })
  const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } })
    if (!res.ok) return null
    const json = (await res.json()) as PlaceDetailsResponse
    if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      return null
    }
    return json
  } catch {
    return null
  }
}

/**
 * Resolve which Place IDs to query: explicit caller IDs win, env var is the
 * fallback. Returns an empty array if nothing is configured (caller will fall
 * back to static testimonials).
 */
export function resolvePlaceIds(explicit?: string[]): string[] {
  const merged = [...(explicit ?? []), ...ENV_PLACE_IDS]
  return Array.from(new Set(merged.filter(Boolean)))
}

/**
 * Fetch + aggregate reviews across N Place IDs. Returns `null` if nothing is
 * configured or every API call failed — callers should render their static
 * fallback in that case.
 */
export async function getAggregatedReviews({
  placeIds,
  perPlaceLimit = 3,
  totalLimit = 9,
  minRating = 4,
}: {
  placeIds?: string[]
  perPlaceLimit?: number
  totalLimit?: number
  minRating?: number
} = {}): Promise<AggregatedReviews | null> {
  const ids = resolvePlaceIds(placeIds)
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[google-reviews] called', {
      hasApiKey: !!API_KEY,
      apiKeyPrefix: API_KEY ? `${API_KEY.slice(0, 6)}…${API_KEY.slice(-4)}` : null,
      idCount: ids.length,
      ids,
    })
  }
  if (ids.length === 0 || !API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[google-reviews] bailing — no API key or no Place IDs')
    }
    return null
  }

  const responses = await Promise.all(ids.map((id) => fetchPlaceDetails(id)))

  const sources: AggregatedReviews['sources'] = []
  const reviews: GoogleReview[] = []

  responses.forEach((res, idx) => {
    if (!res?.result) return
    const placeId = ids[idx]
    const placeName = res.result.name
    if (typeof res.result.rating === 'number' && typeof res.result.user_ratings_total === 'number') {
      sources.push({
        placeId,
        placeName,
        rating: res.result.rating,
        reviewCount: res.result.user_ratings_total,
      })
    }
    if (Array.isArray(res.result.reviews)) {
      const slice = res.result.reviews
        .filter((r) => typeof r.rating === 'number' && (r.rating ?? 0) >= minRating)
        .slice(0, perPlaceLimit)
        .map<GoogleReview>((r) => ({
          authorName: r.author_name ?? 'Guest',
          authorPhotoUrl: r.profile_photo_url,
          rating: r.rating ?? 5,
          text: (r.text ?? '').trim(),
          relativeTime: r.relative_time_description ?? '',
          language: r.language,
          sourcePlaceName: placeName,
        }))
        .filter((r) => r.text.length > 0)
      reviews.push(...slice)
    }
  })

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[google-reviews] aggregated', {
      sourcesCount: sources.length,
      sourceStatuses: responses.map((r, i) => ({
        id: ids[i],
        ok: !!r?.result,
        name: r?.result?.name,
        status: r?.status,
        reviewCount: r?.result?.reviews?.length,
      })),
      reviewsKept: reviews.length,
      minRatingFilter: minRating,
    })
  }

  if (reviews.length === 0 && sources.length === 0) return null

  const ratingValue =
    sources.length > 0
      ? sources.reduce((acc, s) => acc + s.rating * s.reviewCount, 0) /
      Math.max(1, sources.reduce((acc, s) => acc + s.reviewCount, 0))
      : 0
  const reviewCount = sources.reduce((acc, s) => acc + s.reviewCount, 0)

  // Most recent reviews tend to come first in Google's response; we trust that.
  return {
    reviews: reviews.slice(0, totalLimit),
    ratingValue: Number(ratingValue.toFixed(2)),
    reviewCount,
    sources,
  }
}

export function isGoogleReviewsConfigured(): boolean {
  return !!API_KEY && resolvePlaceIds().length > 0
}
