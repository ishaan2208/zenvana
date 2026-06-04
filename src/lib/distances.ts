/**
 * "Getting here" data for property pages — real Dehradun transit hubs and
 * nearby anchors with verified coordinates. Straight-line distance is computed
 * per-property from its lat/lng (Haversine); transit hubs also carry an
 * operator-stated approximate drive time (the same figures used in the homepage
 * FAQ), because straight-line km misrepresents travel time on hill roads.
 *
 * NOTE: this is a curated brand-wide anchor set, accurate for the Rajpur Road
 * corridor. To make distances/landmarks editable per property, see
 * CURSOR_BACKEND_INSTRUCTIONS.md (admin web1 + public API).
 */

export type PlaceKind = 'transit' | 'nearby'

export type PlaceAnchor = {
  name: string
  lat: number
  lng: number
  kind: PlaceKind
  category: string
  /** Operator-stated approximate drive time (transit anchors only). */
  driveTime?: string
}

export type PlaceDistance = PlaceAnchor & { km: number }

/** Per-property overrides from the public API (`PropertyPublicProfile.nearbyPlaces`). */
export type PropertyNearbyPlace = {
  name: string
  category: string
  kind: PlaceKind
  lat?: number
  lng?: number
  distanceKm?: number
  driveTime?: string
}

const ANCHORS: PlaceAnchor[] = [
  // Transit — drive times match the homepage FAQ (operator-stated, Rajpur Road).
  { name: 'Jolly Grant Airport (DED)', lat: 30.1897, lng: 78.1803, kind: 'transit', category: 'Airport', driveTime: '≈ 45 min' },
  { name: 'Dehradun Railway Station', lat: 30.3165, lng: 78.0322, kind: 'transit', category: 'Railway', driveTime: '20–25 min' },
  { name: 'ISBT Dehradun', lat: 30.2897, lng: 78.0205, kind: 'transit', category: 'Bus terminal', driveTime: '20–25 min' },
  { name: 'Mall Road, Mussoorie', lat: 30.4599, lng: 78.0747, kind: 'transit', category: 'Hill station', driveTime: '35–45 min' },
  // Nearby — straight-line km only (sorted nearest first at render time).
  { name: 'Pacific Mall', lat: 30.3433, lng: 78.0413, kind: 'nearby', category: 'Shopping' },
  { name: "Robber's Cave (Guchhupani)", lat: 30.3766, lng: 78.064, kind: 'nearby', category: 'Nature walk' },
  { name: 'Sahastradhara', lat: 30.3877, lng: 78.1316, kind: 'nearby', category: 'Sulphur springs' },
  { name: 'Forest Research Institute', lat: 30.3416, lng: 77.9997, kind: 'nearby', category: 'Heritage' },
  { name: 'Clock Tower & Paltan Bazaar', lat: 30.3245, lng: 78.0419, kind: 'nearby', category: 'City centre' },
]

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`
}

function resolvePlaceKm(
  propLat: number | null | undefined,
  propLng: number | null | undefined,
  place: { lat?: number; lng?: number; distanceKm?: number },
  fallbackLat: number,
  fallbackLng: number,
): number {
  if (place.distanceKm != null && Number.isFinite(place.distanceKm)) {
    return place.distanceKm
  }
  const aLat = propLat ?? undefined
  const aLng = propLng ?? undefined
  if (aLat != null && aLng != null && place.lat != null && place.lng != null) {
    return haversineKm(aLat, aLng, place.lat, place.lng)
  }
  if (place.lat != null && place.lng != null) {
    return haversineKm(fallbackLat, fallbackLng, place.lat, place.lng)
  }
  return 0
}

function anchorsFromPropertyPlaces(
  propLat: number | null | undefined,
  propLng: number | null | undefined,
  nearbyPlaces: PropertyNearbyPlace[],
): PlaceDistance[] {
  const fallbackLat = propLat ?? 30.35
  const fallbackLng = propLng ?? 78.04
  return nearbyPlaces.map((p) => {
    const lat = p.lat ?? fallbackLat
    const lng = p.lng ?? fallbackLng
    return {
      name: p.name,
      lat,
      lng,
      kind: p.kind,
      category: p.category,
      driveTime: p.driveTime,
      km: resolvePlaceKm(propLat, propLng, p, fallbackLat, fallbackLng),
    }
  })
}

/** Anchors with per-property distance. Uses `nearbyPlaces` when provided; else brand anchors. */
export function placesNear(
  lat?: number | null,
  lng?: number | null,
  nearbyPlaces?: PropertyNearbyPlace[] | null,
): { transit: PlaceDistance[]; nearby: PlaceDistance[] } {
  if (Array.isArray(nearbyPlaces) && nearbyPlaces.length > 0) {
    const withKm = anchorsFromPropertyPlaces(lat, lng, nearbyPlaces)
    return {
      transit: withKm.filter((a) => a.kind === 'transit'),
      nearby: withKm.filter((a) => a.kind === 'nearby').sort((x, y) => x.km - y.km),
    }
  }

  if (lat == null || lng == null) return { transit: [], nearby: [] }
  const withKm = ANCHORS.map((a) => ({ ...a, km: haversineKm(lat, lng, a.lat, a.lng) }))
  return {
    transit: withKm.filter((a) => a.kind === 'transit'),
    nearby: withKm.filter((a) => a.kind === 'nearby').sort((x, y) => x.km - y.km),
  }
}
