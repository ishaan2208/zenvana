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
