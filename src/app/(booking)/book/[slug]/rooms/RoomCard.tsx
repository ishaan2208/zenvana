'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Check,
  CircleAlert,
  MoonStar,
  Users,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/Button'
import { PriceWithTax } from '@/components/PriceWithTax'
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
  const [selectedPlanByOcc, setSelectedPlanByOcc] = useState<
    Record<number, PublicRatesWithPlansPlan>
  >({})

  const getNightsForOcc = (occ: number) => {
    if (occ === 1) return nightsForPlans1
    if (occ === 2) return nightsForPlans2
    if (occ === 3) return nightsForPlans3
    if (occ === 4) return nightsForPlans4
    return nights
  }

  const selectedCombination =
    selectedCombinationIndex >= 0 ? shareCombinations[selectedCombinationIndex] : null

  const occupanciesInCombination = selectedCombination
    ? Object.keys(selectedCombination.breakdown).map(Number).sort((a, b) => a - b)
    : []

  const getPlansForOccFiltered = (
    occ: number,
    mealPlan: string | null
  ): PublicRatesWithPlansPlan[] => {
    const list = getPlansForOcc(
      occ,
      plansForOccupancy1,
      plansForOccupancy2,
      plansForOccupancy3,
      plansForOccupancy4
    )
    if (!mealPlan) return list
    return list.filter((p) => (p.mealPlan ?? 'EP') === mealPlan)
  }

  const availableMealPlans = (() => {
    if (!selectedCombination || occupanciesInCombination.length === 0) return []
    const sets = occupanciesInCombination.map((occ) => {
      const s = new Set<string>()
      for (const p of getPlansForOcc(
        occ,
        plansForOccupancy1,
        plansForOccupancy2,
        plansForOccupancy3,
        plansForOccupancy4
      )) {
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
    occupanciesInCombination.every(
      (occ) => getPlansForOccFiltered(occ, selectedMealPlan).length > 0
    )

  const onePlanPerShare =
    selectedMealPlan != null &&
    occupanciesInCombination.every(
      (occ) => getPlansForOccFiltered(occ, selectedMealPlan).length === 1
    )

  const canProceedToCheckout =
    selectedCombination &&
    selectedMealPlan != null &&
    allOccupanciesHavePlanForMealType &&
    occupanciesInCombination.every((occ) => selectedPlanByOcc[occ] != null) &&
    occupanciesInCombination.every(
      (occ) => (selectedPlanByOcc[occ]?.mealPlan ?? 'EP') === selectedMealPlan
    )

  const allPlansForCombination = selectedCombination
    ? occupanciesInCombination.every(
      (occ) =>
        getPlansForOcc(
          occ,
          plansForOccupancy1,
          plansForOccupancy2,
          plansForOccupancy3,
          plansForOccupancy4
        ).length > 0
    )
    : false

  useEffect(() => {
    if (shareCombinations.length !== 1 || selectedCombinationIndex >= 0) return
    setSelectedCombinationIndex(0)
  }, [shareCombinations.length, selectedCombinationIndex])

  useEffect(() => {
    if (!selectedCombination || availableMealPlans.length !== 1) return
    setSelectedMealPlan(availableMealPlans[0])
  }, [selectedCombinationIndex, availableMealPlans.length, availableMealPlans[0]])

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
    const nightsVal =
      occupancyOverride === 2
        ? nightsForPlans2
        : occupancyOverride === 1
          ? nightsForPlans1
          : nightsForPlans

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

    const occ =
      occupancyOverride ?? (occupancyParam ? parseInt(occupancyParam, 10) : undefined)

    if (occ != null) p.set('occupancy', String(occ))
    return p
  }

  return (
    <Card
      className={`overflow-hidden rounded-[2rem] border-border/60 bg-card/75 text-card-foreground shadow-[0_18px_45px_rgba(8,17,31,0.05)] dark:bg-card/50 ${soldOut ? 'border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20' : ''
        }`}
    >
      <CardContent className="p-0">
        {soldOut && (
          <div className="border-b border-amber-300/60 bg-amber-100/80 px-5 py-3 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="text-sm leading-6">
                {noRatePlanForOccupancy
                  ? `No rate plans are available for ${occupancyParam ? `${occupancyParam} guest${occupancyParam === '1' ? '' : 's'}` : 'this guest count'}.`
                  : availableRooms <= 0
                    ? 'No rooms are available for these dates.'
                    : `Only ${availableRooms} room${availableRooms !== 1 ? 's' : ''} left, while your search needs ${rooms}.`}
              </div>
            </div>
          </div>
        )}

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2
                  className={`font-serif text-2xl tracking-[-0.04em] ${soldOut ? 'text-foreground/65' : 'text-foreground'
                    }`}
                >
                  {name}
                </h2>

                {occupancy && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground dark:bg-background/40">
                    <Users className="h-3.5 w-3.5" />
                    Max {occupancy}
                  </span>
                )}

                {!soldOut && availableRooms === 1 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-100/70 px-3 py-1 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                    Only 1 room left
                  </span>
                )}
              </div>

              {shortDescription && (
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  {shortDescription}
                </p>
              )}
            </div>

          </div>

          {!soldOut && !hasPlans && (
            <div className="mt-5 rounded-[1.35rem] border border-border/60 bg-background/55 px-4 py-4 dark:bg-background/35">
              <p className="text-sm leading-7 text-muted-foreground">
                No rate plans are currently loaded for these dates.
              </p>
            </div>
          )}

          {!soldOut && multiRoomMode && hasMultiRoomPlans && (
            <div className="mt-6 space-y-6 border-t border-border/60 pt-6">
              {shareCombinations.length > 1 && (
                <section className="space-y-3">
                  <StepLabel number="1" title="Choose how to split your party" />
                  <div className="flex flex-wrap gap-2.5">
                    {shareCombinations.map((combo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedCombinationIndex(idx)
                          setSelectedMealPlan(null)
                          setSelectedPlanByOcc({})
                        }}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${selectedCombinationIndex === idx
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background/70 text-foreground hover:bg-accent/40 dark:bg-background/40'
                          }`}
                      >
                        {combo.label}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {selectedCombination && allPlansForCombination && (
                <>
                  {availableMealPlans.length === 0 && (
                    <div className="rounded-[1.35rem] border border-amber-300/60 bg-amber-100/70 px-4 py-3 text-sm leading-7 text-amber-900 dark:bg-amber-950/25 dark:text-amber-200">
                      No plan type is available for all share types in this combination.
                      {shareCombinations.length > 1
                        ? ' Please choose another combination.'
                        : ''}
                    </div>
                  )}

                  {availableMealPlans.length > 1 && (
                    <section className="space-y-3">
                      <StepLabel
                        number={shareCombinations.length > 1 ? '2' : '1'}
                        title="Select a meal plan type"
                      />
                      <p className="text-xs leading-6 text-muted-foreground">
                        EP = Room only · CP = With breakfast · MAP = Half board · AP = Full board
                      </p>

                      <div className="flex flex-wrap gap-2.5">
                        {availableMealPlans.map((mp) => (
                          <button
                            key={mp}
                            type="button"
                            onClick={() => {
                              setSelectedMealPlan(mp)
                              setSelectedPlanByOcc({})
                            }}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${selectedMealPlan === mp
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-background/70 text-foreground hover:bg-accent/40 dark:bg-background/40'
                              }`}
                          >
                            {MEAL_PLAN_LABELS[mp] ?? mp}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {selectedMealPlan != null &&
                    availableMealPlans.includes(selectedMealPlan) &&
                    !onePlanPerShare && (
                      <section className="space-y-4">
                        <StepLabel
                          number={shareCombinations.length > 1 ? '3' : '2'}
                          title="Select one rate plan for each share type"
                        />

                        {occupanciesInCombination.map((occ) => {
                          const planList = getPlansForOccFiltered(occ, selectedMealPlan)
                          const shareLabel =
                            occ === 1
                              ? 'Single'
                              : occ === 2
                                ? 'Double'
                                : occ === 3
                                  ? 'Triple'
                                  : `${occ}-share`

                          const numRooms = selectedCombination.breakdown[occ]
                          const nightsOcc = getNightsForOcc(occ)

                          return (
                            <div key={occ} className="space-y-3">
                              <div className="flex items-center justify-between gap-4">
                                <p className="text-sm font-medium text-foreground">
                                  {shareLabel} share
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {numRooms} room{numRooms > 1 ? 's' : ''}
                                </p>
                              </div>

                              {planList.length === 0 ? (
                                <div className="rounded-[1.35rem] border border-amber-300/60 bg-amber-100/70 px-4 py-3 text-sm leading-7 text-amber-900 dark:bg-amber-950/25 dark:text-amber-200">
                                  No {MEAL_PLAN_LABELS[selectedMealPlan] ?? selectedMealPlan} plans
                                  are available for {shareLabel.toLowerCase()} share.
                                </div>
                              ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {planList.map((plan) => {
                                    const isSelected =
                                      selectedPlanByOcc[occ]?.plan === plan.plan

                                    return (
                                      <button
                                        key={`${occ}-${plan.plan}`}
                                        type="button"
                                        onClick={() =>
                                          setSelectedPlanByOcc((prev) => ({
                                            ...prev,
                                            [occ]: plan,
                                          }))
                                        }
                                        className={`rounded-[1.35rem] border p-4 text-left transition-all ${isSelected
                                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                          : 'border-border bg-background/60 hover:border-foreground/20 dark:bg-background/35'
                                          }`}
                                      >
                                        <div className="flex items-start justify-between gap-4">
                                          <div>
                                            <p className="font-medium text-foreground">
                                              {plan.label}
                                            </p>
                                            <p className="mt-1 text-xs leading-6 text-muted-foreground">
                                              <PriceWithTax amount={plan.averagePricePerNight} suffix={`/night · ${nightsOcc} night${nightsOcc !== 1 ? 's' : ''}`} size="sm" />
                                            </p>
                                          </div>

                                          {isSelected && (
                                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                              <Check className="h-3.5 w-3.5" />
                                            </span>
                                          )}
                                        </div>

                                        <div className="mt-4 flex items-center justify-between gap-4">
                                          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                            Per room
                                          </span>
                                          <span className="text-lg font-semibold text-foreground">
                                            <PriceWithTax amount={plan.totalAmount} size="lg" />
                                          </span>
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </section>
                    )}

                  {selectedMealPlan != null &&
                    (canProceedToCheckout ? (
                      <div className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4 dark:bg-background/35">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                              Total
                            </div>
                            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                              <PriceWithTax
                                amount={occupanciesInCombination.reduce((sum, occ) => {
                                  const plan = selectedPlanByOcc[occ]
                                  const numRooms = selectedCombination!.breakdown[occ]
                                  return sum + (plan ? plan.totalAmount * numRooms : 0)
                                }, 0)}
                                size="2xl"
                              />
                            </p>
                          </div>

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
                                const tariffPerNight =
                                  Math.round((plan.totalAmount / nightsOcc) * 100) / 100

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
                                sessionStorage.setItem(
                                  MULTI_ROOM_STORAGE_KEY,
                                  JSON.stringify(payload)
                                )
                              }

                              router.push(`/book/${slug}/checkout?multiRoom=1`)
                            }}
                          >
                            Continue to checkout
                          </Button>
                        </div>
                      </div>
                    ) : (
                      !onePlanPerShare && (
                        <div className="rounded-[1.35rem] border border-amber-300/60 bg-amber-100/70 px-4 py-3 text-sm leading-7 text-amber-900 dark:bg-amber-950/25 dark:text-amber-200">
                          {!allOccupanciesHavePlanForMealType
                            ? 'Not all share types have a plan for the selected meal plan. Choose another plan type or select the missing rate plan.'
                            : 'Select one rate plan for each share type to continue.'}
                        </div>
                      )
                    ))}
                </>
              )}
            </div>
          )}

          {!soldOut && !multiRoomMode && hasPlans && (
            <div className="mt-6 space-y-4 border-t border-border/60 pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Rate plans
                  </div>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Choose one plan and continue to checkout.
                  </p>
                </div>

                <span className="hidden rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground dark:bg-background/40 sm:inline-flex">
                  {plans.length} option{plans.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid gap-4">
                {plans.map((plan) => {
                  const numRoomsSelected = qtyByPlan[plan.plan] ?? 1
                  const totalForSelection =
                    Math.round(plan.totalAmount * numRoomsSelected * 100) / 100

                  return (
                    <div
                      key={plan.plan}
                      className="rounded-[1.5rem] border border-border/60 bg-background/55 p-4 dark:bg-background/35 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-2xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1 text-xs text-muted-foreground dark:bg-card/70">
                              <MoonStar className="h-3.5 w-3.5" />
                              {MEAL_PLAN_LABELS[plan.mealPlan ?? 'EP'] ?? plan.label}
                            </span>
                          </div>

                          <p className="mt-3 text-lg font-medium tracking-tight text-foreground">
                            {plan.label}
                          </p>

                          <p className="mt-2 text-sm leading-7 text-muted-foreground">
                            <PriceWithTax amount={plan.averagePricePerNight} suffix="/night" size="sm" /> ·{' '}
                            {nightsForPlans} night{nightsForPlans !== 1 ? 's' : ''} ·{' '}
                            <PriceWithTax amount={plan.totalAmount} suffix=" per room" size="sm" />
                          </p>
                        </div>

                        <div className="rounded-[1.2rem] border border-border/60 bg-card px-4 py-3 text-left dark:bg-card/70 lg:min-w-[200px] lg:text-right">
                          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            Selected total
                          </div>
                          <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                            <PriceWithTax amount={totalForSelection} size="2xl" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-4 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          {maxSelectableRooms > 1 && (
                            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Rooms</span>
                              <select
                                value={numRoomsSelected}
                                onChange={(e) =>
                                  setQtyByPlan((prev) => ({
                                    ...prev,
                                    [plan.plan]: Number(e.target.value),
                                  }))
                                }
                                className="rounded-xl border border-border/70 bg-background px-3 py-2 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-background/50"
                              >
                                {Array.from({ length: maxSelectableRooms }, (_, i) => i + 1).map(
                                  (n) => (
                                    <option key={n} value={n}>
                                      {n}
                                    </option>
                                  )
                                )}
                              </select>
                            </label>
                          )}

                          <div className="text-sm text-muted-foreground">
                            {numRoomsSelected} room{numRoomsSelected !== 1 ? 's' : ''} selected
                          </div>
                        </div>

                        <Link
                          href={`/book/${slug}/checkout?${checkoutParams(plan, numRoomsSelected)}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          Continue to checkout
                          <ArrowRight className="h-4 w-4" />
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

function StepLabel({
  number,
  title,
}: {
  number: string
  title: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-xs font-medium text-background">
        {number}
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
    </div>
  )
}