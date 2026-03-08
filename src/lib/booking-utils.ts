/**
 * Split guests across rooms. e.g. (2, 3) → [2, 1]; (4, 8) → [2, 2, 2, 2].
 * Tries to distribute as evenly as possible.
 */
export function getOccupancySplit(rooms: number, guests: number): number[] {
  if (rooms <= 0 || guests <= 0) return []
  const base = Math.floor(guests / rooms)
  const remainder = guests % rooms
  const result: number[] = []
  for (let i = 0; i < rooms; i++) {
    result.push(base + (i < remainder ? 1 : 0))
  }
  return result
}

/** True when all rooms have the same occupancy (e.g. 4 rooms, 8 guests → 2 each). */
export function isOneGo(rooms: number, guests: number): boolean {
  const split = getOccupancySplit(rooms, guests)
  if (split.length <= 1) return true
  const first = split[0]
  return split.every((n) => n === first)
}
