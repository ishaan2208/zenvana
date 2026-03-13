/**
 * Generates valid ways to split "guests" across "rooms" where each room has 1 to maxOccupancy guests.
 * Returns unique combinations as breakdowns: e.g. { 2: 2, 3: 1 } = 2 double-share rooms + 1 triple-share.
 * Max 3 guests per room.
 */
const DEFAULT_MAX_OCCUPANCY = 3

export type ShareBreakdown = Record<number, number> // occupancy -> count of rooms

function partition(
  guests: number,
  rooms: number,
  maxOcc: number,
  soFar: number[]
): number[][] {
  if (rooms === 0) return guests === 0 ? [soFar] : []
  if (guests < rooms || guests > rooms * maxOcc) return []
  const min = Math.max(1, guests - (rooms - 1) * maxOcc)
  const max = Math.min(maxOcc, guests - (rooms - 1))
  const out: number[][] = []
  for (let occ = min; occ <= max; occ++) {
    const rest = partition(guests - occ, rooms - 1, maxOcc, [...soFar, occ])
    out.push(...rest)
  }
  return out
}

function breakdown(part: number[]): ShareBreakdown {
  const b: ShareBreakdown = {}
  for (const occ of part) {
    b[occ] = (b[occ] ?? 0) + 1
  }
  return b
}

function breakdownKey(b: ShareBreakdown): string {
  return Object.entries(b)
    .sort(([a], [c]) => Number(a) - Number(c))
    .map(([k, v]) => `${k}:${v}`)
    .join(',')
}

export type ShareCombination = {
  label: string
  breakdown: ShareBreakdown
}

export function getShareCombinations(
  rooms: number,
  guests: number,
  maxOccupancy: number = DEFAULT_MAX_OCCUPANCY
): ShareCombination[] {
  if (rooms < 1 || guests < 1 || guests < rooms || guests > rooms * maxOccupancy) {
    return []
  }
  const parts = partition(guests, rooms, maxOccupancy, [])
  const seen = new Set<string>()
  const result: ShareCombination[] = []
  for (const part of parts) {
    const b = breakdown(part)
    const key = breakdownKey(b)
    if (seen.has(key)) continue
    seen.add(key)
    const labels: string[] = []
    const occOrder = [1, 2, 3].filter((occ) => b[occ])
    for (const occ of occOrder) {
      const count = b[occ]
      const shareName =
        occ === 1 ? 'single' : occ === 2 ? 'double' : 'triple'
      labels.push(`${count} ${shareName} share room${count > 1 ? 's' : ''}`)
    }
    result.push({
      label: labels.join(', '),
      breakdown: b,
    })
  }
  return result
}

/** Prefer combinations without triple share: if any combination has no triple (occ 3), hide all that have triple. */
export function filterPreferNoTriple(combinations: ShareCombination[]): ShareCombination[] {
  if (combinations.length <= 1) return combinations
  const hasTriple = (c: ShareCombination) => (c.breakdown[3] ?? 0) > 0
  const anyWithoutTriple = combinations.some((c) => !hasTriple(c))
  if (!anyWithoutTriple) return combinations
  return combinations.filter((c) => !hasTriple(c))
}
