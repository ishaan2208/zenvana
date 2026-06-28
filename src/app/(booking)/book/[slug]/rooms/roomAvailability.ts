import type { PublicRatesWithPlansPlan } from '@/lib/api'
import type { ShareCombination } from './shareCombinations'

/** Row shape after merging availability + rate plans (matches RoomCard sold-out rules). */
export type RoomSelectionRow = {
  availableRooms: number
  multiRoomMode: boolean
  noRatePlanForOccupancy: boolean
  plans: PublicRatesWithPlansPlan[]
  shareCombinations?: ShareCombination[]
  plansForOccupancy1?: PublicRatesWithPlansPlan[]
  plansForOccupancy2?: PublicRatesWithPlansPlan[]
  plansForOccupancy3?: PublicRatesWithPlansPlan[]
  plansForOccupancy4?: PublicRatesWithPlansPlan[]
}

export type RoomTypeSortInput = RoomSelectionRow & {
  averagePricePerNight: number
  name?: string
}

function getPlansForOcc(
  occ: number,
  p1?: PublicRatesWithPlansPlan[],
  p2?: PublicRatesWithPlansPlan[],
  p3?: PublicRatesWithPlansPlan[],
  p4?: PublicRatesWithPlansPlan[],
): PublicRatesWithPlansPlan[] {
  if (occ === 1) return p1 ?? []
  if (occ === 2) return p2 ?? []
  if (occ === 3) return p3 ?? []
  if (occ === 4) return p4 ?? []
  return []
}

function cheapestMultiRoomStayTotal(room: RoomTypeSortInput): number | null {
  const combo = room.shareCombinations?.[0]
  if (!combo) return null

  const occupancies = Object.keys(combo.breakdown)
    .map(Number)
    .sort((a, b) => a - b)
  if (occupancies.length === 0) return null

  const mealPlanSets = occupancies.map((occ) => {
    const set = new Set<string>()
    for (const plan of getPlansForOcc(
      occ,
      room.plansForOccupancy1,
      room.plansForOccupancy2,
      room.plansForOccupancy3,
      room.plansForOccupancy4,
    )) {
      set.add(plan.mealPlan ?? 'EP')
    }
    return set
  })

  const commonMealPlans = Array.from(mealPlanSets[0] ?? []).filter((mealPlan) =>
    mealPlanSets.slice(1).every((set) => set.has(mealPlan)),
  )

  let minTotal = Infinity
  for (const mealPlan of commonMealPlans) {
    let total = 0
    let valid = true

    for (const occ of occupancies) {
      const matchingPlans = getPlansForOcc(
        occ,
        room.plansForOccupancy1,
        room.plansForOccupancy2,
        room.plansForOccupancy3,
        room.plansForOccupancy4,
      ).filter((plan) => (plan.mealPlan ?? 'EP') === mealPlan)

      if (matchingPlans.length === 0) {
        valid = false
        break
      }

      total += matchingPlans[0].totalAmount * combo.breakdown[occ]
    }

    if (valid && total > 0 && total < minTotal) {
      minTotal = total
    }
  }

  return minTotal === Infinity ? null : minTotal
}

/** Lowest purchasable stay price for ordering room types (ascending). */
export function getRoomTypeSortPrice(room: RoomTypeSortInput): number {
  if (room.multiRoomMode) {
    const total = cheapestMultiRoomStayTotal(room)
    if (total != null) return total
    return room.averagePricePerNight > 0 ? room.averagePricePerNight : Infinity
  }

  if (!room.noRatePlanForOccupancy && room.plans.length > 0) {
    let minTotal = Infinity
    for (const plan of room.plans) {
      if (plan.totalAmount > 0 && plan.totalAmount < minTotal) {
        minTotal = plan.totalAmount
      }
    }
    if (minTotal !== Infinity) return minTotal
  }

  return room.averagePricePerNight > 0 ? room.averagePricePerNight : Infinity
}

export function sortRoomTypesByLowestRate<T extends RoomTypeSortInput>(rooms: T[]): T[] {
  return [...rooms].sort((a, b) => {
    const priceDiff = getRoomTypeSortPrice(a) - getRoomTypeSortPrice(b)
    if (priceDiff !== 0) return priceDiff
    return (a.name ?? '').localeCompare(b.name ?? '')
  })
}

/**
 * True when the guest can actually complete a booking for this room type
 * (inventory + rate plans). Mirrors RoomCard sold-out logic.
 */
export function isRoomTypePurchasable(
  room: RoomSelectionRow,
  requestedRooms: number,
): boolean {
  if (room.availableRooms < requestedRooms || room.availableRooms <= 0) {
    return false
  }

  if (room.multiRoomMode) {
    const combos = room.shareCombinations ?? []
    if (combos.length === 0) return false
    const hasAnyPlans =
      (room.plansForOccupancy1?.length ?? 0) > 0 ||
      (room.plansForOccupancy2?.length ?? 0) > 0 ||
      (room.plansForOccupancy3?.length ?? 0) > 0 ||
      (room.plansForOccupancy4?.length ?? 0) > 0
    return hasAnyPlans
  }

  if (room.noRatePlanForOccupancy) return false
  if (!room.plans?.length) return false
  return true
}

/** Mirrors {@link isRoomTypePurchasable} for UI (sold-out banner, disabled booking). */
export function isRoomTypeSoldOut(
  room: RoomSelectionRow,
  requestedRooms: number,
): boolean {
  return !isRoomTypePurchasable(room, requestedRooms)
}
