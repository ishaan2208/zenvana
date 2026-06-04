/**
 * Programmatic SEO helpers — derive a set of landmark pages from
 * the property API's `landmarks` field.
 *
 * The backend types `landmarks` as `unknown` (shape may evolve), so this
 * module defensively normalizes anything that looks like a landmark and
 * always falls back to a curated seed list so the route surface never
 * regresses to zero pages.
 */

import { getPublicProperties, getPublicPropertyBySlug, type PublicPropertyDetail } from './api'

export type Landmark = {
  /** URL-safe slug, e.g. "pacific-mall-dehradun" */
  slug: string
  /** Display name, e.g. "Pacific Mall" */
  name: string
  /** Optional human-readable category */
  category?: string
  /** Optional latitude */
  lat?: number
  /** Optional longitude */
  lng?: number
}

export type PropertyDistance = {
  slug: string
  publicName: string
  city?: string
  state?: string
  heroImageUrl?: string
  shortDescription?: string
  /** Estimated distance in km, or undefined if either lat/lng missing */
  distanceKm?: number
}

export function slugifyLandmark(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Curated seed landmarks — used when the backend has none yet, so the
 * programmatic surface always renders a meaningful number of pages.
 * These are well-known Dehradun anchors that match real search intent.
 *
 * Rajpur Road row below: Rashtrapati Niketan coords from Wikipedia; Sakya Centre
 * from OpenStreetMap (Nominatim); Sai Mandir, MDDA Park, St. Joseph's Academy from
 * OSM nodes/ways (Komoot Photon geocoder). Rashtrapati Tapovan is the adjacent
 * presidential forest estate on the same corridor (see presidentofindia.gov.in,
 * June 2025) — add a separate pin when a stable map POI exists in OSM.
 */
const SEED_LANDMARKS: Landmark[] = [
  { slug: 'pacific-mall-dehradun', name: 'Pacific Mall', category: 'Shopping', lat: 30.3433, lng: 78.0413 },
  { slug: 'forest-research-institute', name: 'Forest Research Institute (FRI)', category: 'Heritage', lat: 30.3414, lng: 77.9994 },
  { slug: 'rajpur-road', name: 'Rajpur Road', category: 'Neighbourhood', lat: 30.3622, lng: 78.0808 },
  {
    slug: 'rashtrapati-niketan-dehradun',
    name: 'Rashtrapati Niketan',
    category: 'Heritage · Rajpur Road',
    lat: 30.3568025,
    lng: 78.0661364,
  },
  {
    slug: 'sakya-centre-rajpur',
    name: 'Sakya Centre Buddhist Monastery',
    category: 'Spiritual · Rajpur Road',
    lat: 30.3793399,
    lng: 78.0870745,
  },
  {
    slug: 'sai-mandir-rajpur-road',
    name: 'Sai Mandir (Sai Darbar)',
    category: 'Temples · Rajpur Road',
    lat: 30.3798038,
    lng: 78.0874513,
  },
  {
    slug: 'mdda-park-rajpur',
    name: 'MDDA Park, Rajpur',
    category: 'Parks · Rajpur Road',
    lat: 30.3905419,
    lng: 78.0945953,
  },
  {
    slug: 'st-josephs-academy-rajpur',
    name: "St. Joseph's Academy",
    category: 'Schools · Rajpur Road',
    lat: 30.3295343,
    lng: 78.0487559,
  },
  { slug: 'doon-school', name: 'The Doon School', category: 'Schools', lat: 30.3245, lng: 78.0444 },
  { slug: 'welham-girls-school', name: 'Welham Girls\' School', category: 'Schools', lat: 30.3295, lng: 78.0481 },
  { slug: 'indian-military-academy', name: 'Indian Military Academy (IMA)', category: 'Institutions', lat: 30.3478, lng: 77.9665 },
  { slug: 'jolly-grant-airport', name: 'Jolly Grant Airport (DED)', category: 'Airport', lat: 30.1897, lng: 78.1803 },
  { slug: 'isbt-dehradun', name: 'ISBT Dehradun', category: 'Transit', lat: 30.2956, lng: 78.0322 },
  { slug: 'dehradun-railway-station', name: 'Dehradun Railway Station', category: 'Transit', lat: 30.3204, lng: 78.0382 },
  { slug: 'clock-tower-dehradun', name: 'Clock Tower (Ghanta Ghar)', category: 'Landmarks', lat: 30.3253, lng: 78.0432 },
  { slug: 'mussoorie', name: 'Mussoorie', category: 'Hill station', lat: 30.4598, lng: 78.0664 },
  { slug: 'rishikesh', name: 'Rishikesh', category: 'Spiritual', lat: 30.0869, lng: 78.2676 },
  { slug: 'sahastradhara', name: 'Sahastradhara', category: 'Attractions', lat: 30.3866, lng: 78.1316 },
  { slug: 'robbers-cave', name: 'Robber\'s Cave (Guchhupani)', category: 'Attractions', lat: 30.4123, lng: 78.0795 },
  { slug: 'mindrolling-monastery', name: 'Mindrolling Monastery', category: 'Spiritual', lat: 30.2948, lng: 77.9812 },
  { slug: 'iim-kashipur', name: 'IIM Kashipur (campus visits)', category: 'Institutions', lat: 30.3204, lng: 78.0382 },
  { slug: 'paltan-bazaar', name: 'Paltan Bazaar', category: 'Shopping', lat: 30.3210, lng: 78.0375 },
]

function maybeStringField(obj: unknown, ...keys: string[]): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined
  const o = obj as Record<string, unknown>
  for (const k of keys) {
    const v = o[k]
    if (typeof v === 'string' && v.trim().length > 0) return v.trim()
  }
  return undefined
}

function maybeNumberField(obj: unknown, ...keys: string[]): number | undefined {
  if (!obj || typeof obj !== 'object') return undefined
  const o = obj as Record<string, unknown>
  for (const k of keys) {
    const v = o[k]
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string') {
      const n = Number(v)
      if (Number.isFinite(n)) return n
    }
  }
  return undefined
}

export function normalizeLandmark(raw: unknown): Landmark | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    const name = raw.trim()
    if (!name) return null
    return { slug: slugifyLandmark(name), name }
  }
  if (typeof raw === 'object') {
    const name = maybeStringField(raw, 'name', 'title', 'label', 'place')
    if (!name) return null
    const category = maybeStringField(raw, 'category', 'type', 'tag')
    const lat = maybeNumberField(raw, 'lat', 'latitude')
    const lng = maybeNumberField(raw, 'lng', 'lon', 'longitude')
    return {
      slug: slugifyLandmark(name),
      name,
      ...(category && { category }),
      ...(lat != null && { lat }),
      ...(lng != null && { lng }),
    }
  }
  return null
}

/** Normalize stored JSON — array, wrapped object, or JSON string. */
export function coerceLandmarksArray(landmarks: unknown): unknown[] {
  if (landmarks == null) return []
  if (typeof landmarks === 'string') {
    try {
      return coerceLandmarksArray(JSON.parse(landmarks))
    } catch {
      return []
    }
  }
  if (Array.isArray(landmarks)) return landmarks
  if (typeof landmarks === 'object') {
    const o = landmarks as Record<string, unknown>
    for (const key of ['landmarks', 'items', 'nearby', 'places']) {
      const nested = o[key]
      if (Array.isArray(nested)) return nested
    }
  }
  return []
}

/** Short line for pickers (e.g. hero book bar): first landmark names, middot-separated. */
export function formatPropertyLandmarkHint(landmarks: unknown, maxItems = 3): string | undefined {
  const list = coerceLandmarksArray(landmarks)
  if (list.length === 0) return undefined
  const names: string[] = []
  for (const raw of list) {
    const lm = normalizeLandmark(raw)
    if (!lm || names.includes(lm.name)) continue
    names.push(lm.name)
    if (names.length >= maxItems) break
  }
  if (names.length === 0) return undefined
  return names.join(' · ')
}

export type PropertyLandmarkHintInput = {
  landmarks?: unknown
  latitude?: number | null
  longitude?: number | null
}

/** Profile landmarks first; otherwise nearest curated anchors from map coordinates. */
export function buildPropertyLandmarkHint(
  input: PropertyLandmarkHintInput,
  maxItems = 3,
): string | undefined {
  const fromProfile = formatPropertyLandmarkHint(input.landmarks, maxItems)
  if (fromProfile) return fromProfile

  const lat = input.latitude
  const lng = input.longitude
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return undefined
  }

  const nearby = nearestLandmarksForMap(lat, lng, maxItems)
  if (nearby.length === 0) return undefined
  return nearby.map((l) => l.name).join(' · ')
}

function dedupeBySlug(landmarks: Landmark[]): Landmark[] {
  const seen = new Map<string, Landmark>()
  for (const l of landmarks) {
    const existing = seen.get(l.slug)
    if (!existing) {
      seen.set(l.slug, l)
      continue
    }
    // Merge: keep richer data (lat/lng wins, longer name wins).
    const merged: Landmark = {
      slug: l.slug,
      name: l.name.length > existing.name.length ? l.name : existing.name,
      category: existing.category ?? l.category,
      lat: existing.lat ?? l.lat,
      lng: existing.lng ?? l.lng,
    }
    seen.set(l.slug, merged)
  }
  return Array.from(seen.values())
}

/** Pull landmarks from every published property and merge with the seed set. */
export async function getAllLandmarks(): Promise<Landmark[]> {
  let propertyLandmarks: Landmark[] = []
  try {
    const list = await getPublicProperties()
    const details = await Promise.all(
      list.map((p) => getPublicPropertyBySlug(p.slug).catch(() => null)),
    )
    for (const d of details) {
      if (!d || !Array.isArray(d.landmarks)) continue
      for (const raw of d.landmarks) {
        const lm = normalizeLandmark(raw)
        if (lm) propertyLandmarks.push(lm)
      }
    }
  } catch {
    propertyLandmarks = []
  }
  return dedupeBySlug([...SEED_LANDMARKS, ...propertyLandmarks])
}

export async function getLandmarkBySlug(slug: string): Promise<Landmark | null> {
  const all = await getAllLandmarks()
  return all.find((l) => l.slug === slug) ?? null
}

/**
 * Estimate distance in km between two lat/lng points (great-circle / haversine).
 * Honest enough for "within 5 km" / "within 30 min drive" copy on a programmatic page.
 */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371 // km
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

/** Curated Dehradun anchors for small maps (e.g. property hero map). */
export type NearbyMapLandmark = {
  name: string
  lat: number
  lng: number
  category?: string
}

/**
 * Closest seed landmarks to a point — capped for readability on embedded maps
 * (Pacific Mall, transit, attractions, etc. from {@link SEED_LANDMARKS}).
 */
export function nearestLandmarksForMap(
  centerLat: number,
  centerLng: number,
  limit = 5,
): NearbyMapLandmark[] {
  const center = { lat: centerLat, lng: centerLng }
  return SEED_LANDMARKS.filter((l): l is Landmark & { lat: number; lng: number } => l.lat != null && l.lng != null)
    .map((l) => ({
      name: l.name,
      lat: l.lat,
      lng: l.lng,
      category: l.category,
      _km: haversineKm(center, { lat: l.lat, lng: l.lng }),
    }))
    .sort((a, b) => a._km - b._km)
    .slice(0, Math.max(1, Math.min(limit, 8)))
    .map(({ _km, ...rest }) => rest)
}

type RateablePropertyInput = {
  slug: string
  publicName: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number
  descriptionShort?: string
  images?: unknown
}

export function ratePropertiesByDistance(
  landmark: Landmark,
  properties: RateablePropertyInput[] = [],
  heroResolver?: (slug: string) => string | undefined,
): PropertyDistance[] {
  const haveLandmarkCoords = landmark.lat != null && landmark.lng != null

  const out: PropertyDistance[] = properties.map((p) => {
    const distanceKm =
      haveLandmarkCoords && p.latitude != null && p.longitude != null
        ? haversineKm(
          { lat: landmark.lat as number, lng: landmark.lng as number },
          { lat: p.latitude, lng: p.longitude },
        )
        : undefined

    return {
      slug: p.slug,
      publicName: p.publicName,
      city: p.city,
      state: p.state,
      heroImageUrl: heroResolver?.(p.slug),
      shortDescription: p.descriptionShort,
      distanceKm,
    }
  })

  return out.sort((a, b) => {
    if (a.distanceKm == null && b.distanceKm == null) return 0
    if (a.distanceKm == null) return 1
    if (b.distanceKm == null) return -1
    return a.distanceKm - b.distanceKm
  })
}

export function formatDistance(km: number | undefined): string {
  if (km == null) return '—'
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

export function estimateDriveMinutes(km: number | undefined): string {
  if (km == null) return '—'
  // Loose Dehradun average: ~30 km/h with traffic
  const minutes = Math.max(3, Math.round((km / 30) * 60))
  if (minutes < 60) return `${minutes} min drive`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} hr drive` : `${h} hr ${m} min drive`
}
