'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/Button'
import type { PublicRatesWithPlansPlan } from '@/lib/api'
import type { ShareCombination } from './shareCombinations'

const MULTI_ROOM_STORAGE_KEY = 'zenvana_multi_room_booking'

const MEAL_PLAN_LABELS: Record<string, string> = {
  EP: 'Room only (EP)',
  CP: 'With breakfast (CP)',
  MAP: 'Half board (MAP)',
  AP: 'Full board (AP)',
}

type RoomCardProps = {
  slug: string
  checkIn: string
  checkOut: string
  occupancyParam: string
  rooms: number
  roomTypeId: number
  name: string
  occupancy: string | null
  shortDescription: string | null
  availableRooms: number
  nights: number
  averagePricePerNight: number
  plans?: PublicRatesWithPlansPlan[]
  nightsForPlans?: number
  noRatePlanForOccupancy?: boolean
  multiRoomMode?: boolean
  totalGuests?: number
  totalRooms?: number
  shareCombinations?: ShareCombination[]
  plansForOccupancy1?: PublicRatesWithPlansPlan[]
  plansForOccupancy2?: PublicRatesWithPlansPlan[]
  plansForOccupancy3?: PublicRatesWithPlansPlan[]
  plansForOccupancy4?: PublicRatesWithPlansPlan[]
  nightsForPlans1?: number
  nightsForPlans2?: number
  nightsForPlans3?: number
  nightsForPlans4?: number
}

function getPlansForOcc(
  occ: number,
  p1: PublicRatesWithPlansPlan[],
  p2: PublicRatesWithPlansPlan[],
  p3: PublicRatesWithPlansPlan[],
  p4: PublicRatesWithPlansPlan[]
): PublicRatesWithPlansPlan[] {
  if (occ === 1) return p1
  if (occ === 2) return p2
  if (occ === 3) return p3
  if (occ === 4) return p4
  return []
}

export function RoomCard({
  slug,
  checkIn,
  checkOut,
  occupancyParam,
  rooms,
  roomTypeId,
  name,
  occupancy,
  shortDescription,
  availableRooms,
  nights,
  averagePricePerNight,
  plans = [],
  nightsForPlans = nights,
  noRatePlanForOccupancy = false,
  multiRoomMode = false,
  shareCombinations = [],
  plansForOccupancy1 = [],
  plansForOccupancy2 = [],
  plansForOccupancy3 = [],
  plansForOccupancy4 = [],
  nightsForPlans1 = nights,
  nightsForPlans2 = nights,
  nightsForPlans3 = nights,
  nightsForPlans4 = nights,
}: RoomCardProps) {
  const router = useRouter()
  const baseParams = new URLSearchParams({
    checkIn,
    checkOut,
    roomTypeId: String(roomTypeId),
    roomTypeName: name,
    availableRooms: String(Math.max(0, availableRooms)),
    rooms: String(rooms),
  })
  if (occupancyParam) baseParams.set('occupancy', occupancyParam)

  const hasMultiRoomPlans =
    multiRoomMode &&
    shareCombinations.length > 0 &&
    (plansForOccupancy1.length > 0 ||
      plansForOccupancy2.length > 0 ||
      plansForOccupancy3.length > 0 ||
      plansForOccupancy4.length > 0)
  const hasPlans = plans.length > 0 || hasMultiRoomPlans
  const effectiveAvailableRooms = hasPlans ? Math.max(1, availableRooms) : availableRooms
  const soldOut =
    !multiRoomMode &&
    (noRatePlanForOccupancy ||
      effectiveAvailableRooms < rooms ||
      effectiveAvailableRooms <= 0)
  const maxSelectableRooms = Math.min(effectiveAvailableRooms, rooms)
  const [qtyByPlan, setQtyByPlan] = useState<Record<string, number>>({})
  const [selectedCombinationIndex, setSelectedCombinationIndex] = useState(-1)
  const [selectedMealPlan, setSelectedMealPlan] = useState<string | null>(null)
  const [selectedPlanByOcc, setSelectedPlanByOcc] = useState<Record<number, PublicRatesWithPlansPlan>>({})

  const getNightsForOcc = (occ: number) => {
    if (occ === 1) return nightsForPlans1
    if (occ === 2) return nightsForPlans2
    if (occ === 3) return nightsForPlans3
    if (occ === 4) return nightsForPlans4
    return nights
  }

  const selectedCombination = selectedCombinationIndex >= 0 ? shareCombinations[selectedCombinationIndex] : null
  const occupanciesInCombination = selectedCombination
    ? Object.keys(selectedCombination.breakdown).map(Number).sort((a, b) => a - b)
    : []

  const getPlansForOccFiltered = (occ: number, mealPlan: string | null): PublicRatesWithPlansPlan[] => {
    const list = getPlansForOcc(occ, plansForOccupancy1, plansForOccupancy2, plansForOccupancy3, plansForOccupancy4)
    if (!mealPlan) return list
    return list.filter((p) => (p.mealPlan ?? 'EP') === mealPlan)
  }

  // Only show plan types that have at least one rate plan for every share type in this combination
  const availableMealPlans = (() => {
    if (!selectedCombination || occupanciesInCombination.length === 0) return []
    const sets = occupanciesInCombination.map((occ) => {
      const s = new Set<string>()
      for (const p of getPlansForOcc(occ, plansForOccupancy1, plansForOccupancy2, plansForOccupancy3, plansForOccupancy4)) {
        s.add(p.mealPlan ?? 'EP')
      }
      return s
    })
    const first = sets[0]
    const rest = sets.slice(1)
    return Array.from(first).filter((mp) => rest.every((set) => set.has(mp))).sort()
  })()

  const allOccupanciesHavePlanForMealType =
    selectedMealPlan != null &&
    occupanciesInCombination.every((occ) => getPlansForOccFiltered(occ, selectedMealPlan).length > 0)

  const onePlanPerShare =
    selectedMealPlan != null &&
    occupanciesInCombination.every((occ) => getPlansForOccFiltered(occ, selectedMealPlan).length === 1)

  const canProceedToCheckout =
    selectedCombination &&
    selectedMealPlan != null &&
    allOccupanciesHavePlanForMealType &&
    occupanciesInCombination.every((occ) => selectedPlanByOcc[occ] != null) &&
    occupanciesInCombination.every((occ) => (selectedPlanByOcc[occ]?.mealPlan ?? 'EP') === selectedMealPlan)

  const allPlansForCombination = selectedCombination
    ? occupanciesInCombination.every((occ) =>
        getPlansForOcc(occ, plansForOccupancy1, plansForOccupancy2, plansForOccupancy3, plansForOccupancy4).length > 0
      )
    : false

  // Auto-select combination when only one split option exists (e.g. after filtering out triple-share)
  useEffect(() => {
    if (shareCombinations.length !== 1 || selectedCombinationIndex >= 0) return
    setSelectedCombinationIndex(0)
  }, [shareCombinations.length, selectedCombinationIndex])

  // Auto-select plan type when only one is available for this combination
  useEffect(() => {
    if (!selectedCombination || availableMealPlans.length !== 1) return
    setSelectedMealPlan(availableMealPlans[0])
  }, [selectedCombinationIndex, availableMealPlans.length, availableMealPlans[0]])

  // Auto-select rate plan per share when each share has exactly one option for the selected plan type
  useEffect(() => {
    if (selectedMealPlan == null || occupanciesInCombination.length === 0) return
    const next: Record<number, PublicRatesWithPlansPlan> = {}
    for (const occ of occupanciesInCombination) {
      const list = getPlansForOccFiltered(occ, selectedMealPlan)
      if (list.length !== 1) return
      next[occ] = list[0]
    }
    setSelectedPlanByOcc(next)
  }, [selectedMealPlan, selectedCombinationIndex])

  const checkoutParams = (
    plan: PublicRatesWithPlansPlan,
    numRooms: number,
    occupancyOverride?: number
  ) => {
    const totalAmount = Math.round(plan.totalAmount * numRooms * 100) / 100
    const nightsVal = occupancyOverride === 2 ? nightsForPlans2 : occupancyOverride === 1 ? nightsForPlans1 : nightsForPlans
    const p = new URLSearchParams({
      checkIn,
      checkOut,
      roomTypeId: String(roomTypeId),
      roomTypeName: name,
      nights: String(nightsVal),
      totalAmount: String(totalAmount),
      numRooms: String(numRooms),
      ratePlan: plan.plan,
      ratePlanLabel: plan.label,
    })
    const occ = occupancyOverride ?? (occupancyParam ? parseInt(occupancyParam, 10) : undefined)
    if (occ != null) p.set('occupancy', String(occ))
    return p
  }

  return (
    <Card className={`overflow-hidden ${soldOut ? 'border-amber-200 bg-slate-50/80' : ''}`}>
      <CardContent className="p-0">
        {soldOut && (
          <div className="relative">
            <div className="absolute right-4 top-4 z-10 rounded bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
              Sold out
            </div>
            <div className="bg-amber-50/80 px-4 py-2 text-center text-sm font-medium text-amber-800">
              {noRatePlanForOccupancy
                ? `Sold out — no rate plans for ${occupancyParam ? `${occupancyParam} guest${occupancyParam === '1' ? '' : 's'}` : 'this guest count'}`
                : availableRooms <= 0
                  ? 'Sold out — no rooms available for these dates'
                  : `Only ${availableRooms} room${availableRooms !== 1 ? 's' : ''} left — need ${rooms}`}
            </div>
          </div>
        )}
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className={`font-semibold ${soldOut ? 'text-slate-500' : 'text-slate-900'}`}>
                {name}
              </h2>
              {occupancy && (
                <p className="mt-1 text-sm text-slate-500">
                  Max occupancy: {occupancy}
                </p>
              )}
              {shortDescription && (
                <p className="mt-2 text-sm text-slate-600">
                  {shortDescription}
                </p>
              )}
              {!soldOut && availableRooms === 1 && (
                <p className="mt-2 text-sm text-amber-600">
                  Only 1 room left
                </p>
              )}
            </div>
            {!soldOut && !hasPlans && (
              <div className="shrink-0 text-right">
                <p className="text-sm text-slate-500">
                  From ₹{averagePricePerNight.toLocaleString('en-IN')}/night (avg)
                </p>
                <p className="mt-2 text-xs text-slate-500">No rate plans loaded for these dates.</p>
              </div>
            )}
          </div>
          {!soldOut && multiRoomMode && hasMultiRoomPlans && (
            <div className="mt-4 border-t border-slate-100 pt-4 space-y-6">
              {shareCombinations.length > 1 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">1. Choose how to split your party</p>
                  <div className="flex flex-wrap gap-2">
                    {shareCombinations.map((combo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedCombinationIndex(idx)
                          setSelectedMealPlan(null)
                          setSelectedPlanByOcc({})
                        }}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                          selectedCombinationIndex === idx
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {combo.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedCombination && allPlansForCombination && (
                <>
                  {availableMealPlans.length === 0 && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      No plan type (EP/CP/MAP) is available for all share types in this combination.
                      {shareCombinations.length > 1 ? ' Please choose another combination above.' : ''}
                    </p>
                  )}
                  {availableMealPlans.length > 1 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">{shareCombinations.length > 1 ? '2. ' : ''}Select plan type (same for all rooms)</p>
                    <p className="mb-2 text-xs text-slate-500">EP = Room only, CP = With breakfast, MAP = Half board, AP = Full board</p>
                    <div className="flex flex-wrap gap-2">
                      {availableMealPlans.map((mp) => (
                        <button
                          key={mp}
                          type="button"
                          onClick={() => {
                            setSelectedMealPlan(mp)
                            setSelectedPlanByOcc({})
                          }}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                            selectedMealPlan === mp
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {MEAL_PLAN_LABELS[mp] ?? mp}
                        </button>
                      ))}
                    </div>
                  </div>
                  )}
                  {selectedMealPlan != null && availableMealPlans.includes(selectedMealPlan) && !onePlanPerShare && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">{shareCombinations.length > 1 ? '3. ' : '2. '}Select one rate plan for each share type</p>
                    {occupanciesInCombination.map((occ) => {
                      const planList = getPlansForOccFiltered(
                        occ,
                        selectedMealPlan
                      )
                      const shareLabel =
                        occ === 1 ? 'Single' : occ === 2 ? 'Double' : occ === 3 ? 'Triple' : `${occ}-share`
                      const numRooms = selectedCombination.breakdown[occ]
                      const nightsOcc = getNightsForOcc(occ)
                      return (
                        <div key={occ} className="mb-4">
                          <p className="mb-2 text-sm text-slate-600">
                            {shareLabel} share ({numRooms} room{numRooms > 1 ? 's' : ''})
                          </p>
                          {planList.length === 0 ? (
                            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                              No {MEAL_PLAN_LABELS[selectedMealPlan] ?? selectedMealPlan} plans for {shareLabel.toLowerCase()} share. Choose another plan type above.
                            </p>
                          ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {planList.map((plan) => {
                              const isSelected = selectedPlanByOcc[occ]?.plan === plan.plan
                              return (
                                <button
                                  key={`${occ}-${plan.plan}`}
                                  type="button"
                                  onClick={() =>
                                    setSelectedPlanByOcc((prev) => ({ ...prev, [occ]: plan }))
                                  }
                                  className={`flex flex-col items-start rounded-lg border p-3 text-left ${
                                    isSelected
                                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                                  }`}
                                >
                                  <span className="font-medium text-slate-900">{plan.label}</span>
                                  <span className="text-xs text-slate-500">
                                    ₹{plan.averagePricePerNight.toLocaleString('en-IN')}/night · {nightsOcc} night{nightsOcc !== 1 ? 's' : ''}
                                  </span>
                                  <span className="mt-1 font-semibold text-slate-900">
                                    ₹{plan.totalAmount.toLocaleString('en-IN')} / room
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  )}
                  {selectedMealPlan != null && (canProceedToCheckout ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-slate-600">
                        Total: ₹
                        {occupanciesInCombination
                          .reduce((sum, occ) => {
                            const plan = selectedPlanByOcc[occ]
                            const numRooms = selectedCombination!.breakdown[occ]
                            const nightsOcc = getNightsForOcc(occ)
                            return sum + (plan ? plan.totalAmount * numRooms : 0)
                          }, 0)
                          .toLocaleString('en-IN')}
                      </span>
                      <Button
                        color="blue"
                        onClick={() => {
                          const roomLines: Array<{
                            roomTypeId: number
                            ratePlanId: number
                            occupancy: number
                            tariff: number
                          }> = []
                          let totalAmount = 0
                          for (const occ of occupanciesInCombination) {
                            const plan = selectedPlanByOcc[occ]
                            if (!plan) continue
                            const numRooms = selectedCombination!.breakdown[occ]
                            const nightsOcc = getNightsForOcc(occ)
                            const tariffPerNight = Math.round((plan.totalAmount / nightsOcc) * 100) / 100
                            for (let i = 0; i < numRooms; i++) {
                              roomLines.push({
                                roomTypeId,
                                ratePlanId: parseInt(plan.plan, 10),
                                occupancy: occ,
                                tariff: tariffPerNight,
                              })
                            }
                            totalAmount += plan.totalAmount * numRooms
                          }
                          const payload = {
                            slug,
                            checkIn,
                            checkOut,
                            nights: getNightsForOcc(occupanciesInCombination[0] ?? 1),
                            roomTypeId,
                            roomTypeName: name,
                            roomLines,
                            totalAmount: Math.round(totalAmount * 100) / 100,
                          }
                          if (typeof window !== 'undefined') {
                            sessionStorage.setItem(MULTI_ROOM_STORAGE_KEY, JSON.stringify(payload))
                          }
                          router.push(`/book/${slug}/checkout?multiRoom=1`)
                        }}
                      >
                        Continue to checkout
                      </Button>
                    </div>
                  ) : (
                    !onePlanPerShare && (
                      <p className="text-sm text-amber-700">
                        {!allOccupanciesHavePlanForMealType
                          ? 'Not all share types have a plan for the selected plan type. Choose another plan type or ensure one rate plan is selected for each share type.'
                          : 'Select one rate plan for each share type above to continue.'}
                      </p>
                    )
                  )
                  )}
                </>
              )}
            </div>
          )}
          {!soldOut && !multiRoomMode && hasPlans && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="mb-3 text-sm font-medium text-slate-700">Rate plans — choose one and continue to checkout</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {plans.map((plan) => {
                  const numRoomsSelected = qtyByPlan[plan.plan] ?? 1
                  const totalForSelection = Math.round(plan.totalAmount * numRoomsSelected * 100) / 100
                  return (
                    <div
                      key={plan.plan}
                      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-900">{plan.label}</p>
                          <p className="text-xs text-slate-500">
                            ₹{plan.averagePricePerNight.toLocaleString('en-IN')}/night · {nightsForPlans} night{nightsForPlans !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <p className="font-semibold text-slate-900">
                          ₹{plan.totalAmount.toLocaleString('en-IN')}
                          <span className="text-xs font-normal text-slate-500"> / room</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {maxSelectableRooms > 1 && (
                          <label className="flex items-center gap-2 text-sm">
                            <span className="text-slate-600">Rooms:</span>
                            <select
                              value={numRoomsSelected}
                              onChange={(e) =>
                                setQtyByPlan((prev) => ({ ...prev, [plan.plan]: Number(e.target.value) }))
                              }
                              className="rounded border border-slate-300 px-2 py-1 text-slate-900"
                            >
                              {Array.from({ length: maxSelectableRooms }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        <span className="text-sm font-medium text-slate-700">
                          Total: ₹{totalForSelection.toLocaleString('en-IN')}
                        </span>
                        <Link
                          href={`/book/${slug}/checkout?${checkoutParams(plan, numRoomsSelected)}`}
                          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          Continue to checkout
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
