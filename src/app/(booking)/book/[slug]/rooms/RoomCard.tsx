'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAppRouter } from '@/hooks/useAppRouter'
import {
  ArrowRight,
  BedDouble,
  ChefHat,
  Check,
  Coffee,
  Info,
  Users,
  UtensilsCrossed,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/Button'
import { PriceWithMarketRate } from '@/components/PriceWithMarketRate'
import { SoldOutTag } from '@/components/SoldOutTag'
import { OnlyOneRoomLeftBadge } from '@/components/OnlyOneRoomLeftBadge'
import { EmblaImageGallery } from '@/components/EmblaImageGallery'
import type { PublicRatesWithPlansPlan } from '@/lib/api'
import { normalizeGalleryImages } from '@/lib/media'
import type { ShareCombination } from './shareCombinations'
import { isRoomTypeSoldOut } from './roomAvailability'

const MULTI_ROOM_STORAGE_KEY = 'zenvana_multi_room_booking'

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
  roomImages?: unknown
  availableRooms: number
  nights: number
  averagePricePerNight: number
  averageMarketRatePerNight?: number
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

const MEAL_PLAN_META: Record<
  string,
  {
    label: string
    short: string
    Icon: React.ComponentType<{ className?: string }>
    description: string
    bullets: string[]
  }
> = {
  EP: {
    label: 'EP',
    short: 'Room only',
    Icon: BedDouble,
    description: 'Stay-focused pricing without included meals.',
    bullets: ['Accommodation only', 'Best for flexible dining plans'],
  },
  CP: {
    label: 'CP',
    short: 'Breakfast included',
    Icon: Coffee,
    description: 'A cleaner start to the day with breakfast included.',
    bullets: ['Breakfast included', 'Accommodation included'],
  },
  MAP: {
    label: 'MAP',
    short: 'Half board',
    Icon: UtensilsCrossed,
    description: 'Breakfast plus one major meal as part of the stay.',
    bullets: ['Breakfast included', 'One major meal included'],
  },
  AP: {
    label: 'AP',
    short: 'Full board',
    Icon: ChefHat,
    description: 'A fuller meal plan for guests who want everything covered.',
    bullets: ['Breakfast included', 'Lunch included', 'Dinner included'],
  },
}

function getMealPlanMeta(code?: string | null) {
  if (!code) return MEAL_PLAN_META.EP
  return MEAL_PLAN_META[code] ?? MEAL_PLAN_META.EP
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
  roomImages,
  availableRooms,
  nights,
  averagePricePerNight,
  averageMarketRatePerNight,
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
  const router = useAppRouter()

  const hasMultiRoomPlans =
    multiRoomMode &&
    shareCombinations.length > 0 &&
    (plansForOccupancy1.length > 0 ||
      plansForOccupancy2.length > 0 ||
      plansForOccupancy3.length > 0 ||
      plansForOccupancy4.length > 0)

  const hasPlans = plans.length > 0 || hasMultiRoomPlans
  const effectiveAvailableRooms = hasPlans ? Math.max(1, availableRooms) : availableRooms

  const soldOut = isRoomTypeSoldOut(
    {
      availableRooms,
      multiRoomMode,
      noRatePlanForOccupancy,
      plans,
      shareCombinations,
      plansForOccupancy1,
      plansForOccupancy2,
      plansForOccupancy3,
      plansForOccupancy4,
    },
    rooms,
  )

  const maxSelectableRooms = Math.min(effectiveAvailableRooms, rooms)
  const showOnlyOneRoomLeft = rooms === 1 && availableRooms === 1

  const [qtyByPlan, setQtyByPlan] = useState<Record<string, number>>({})
  const [selectedCombinationIndex, setSelectedCombinationIndex] = useState(-1)

  const parsedRoomImages = normalizeGalleryImages(roomImages)

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

  const mealPlanCards = (() => {
    if (!selectedCombination || availableMealPlans.length === 0) return []

    return availableMealPlans.map((mealPlan) => {
      const defaultPlanByOcc: Record<number, PublicRatesWithPlansPlan> = {}
      let totalAmount = 0
      let marketTotalAmount: number | undefined

      for (const occ of occupanciesInCombination) {
        const list = getPlansForOcc(
          occ,
          plansForOccupancy1,
          plansForOccupancy2,
          plansForOccupancy3,
          plansForOccupancy4
        ).filter((p) => (p.mealPlan ?? 'EP') === mealPlan)

        if (list.length === 0) return null

        const first = list[0]
        defaultPlanByOcc[occ] = first
        const numRooms = selectedCombination.breakdown[occ]

        totalAmount += first.totalAmount * numRooms

        if (first.marketTotalAmount != null) {
          marketTotalAmount = (marketTotalAmount ?? 0) + first.marketTotalAmount * numRooms
        }
      }

      return {
        mealPlan,
        defaultPlanByOcc,
        totalAmount: Math.round(totalAmount * 100) / 100,
        marketTotalAmount:
          marketTotalAmount != null ? Math.round(marketTotalAmount * 100) / 100 : undefined,
      }
    }).filter(Boolean) as Array<{
      mealPlan: string
      defaultPlanByOcc: Record<number, PublicRatesWithPlansPlan>
      totalAmount: number
      marketTotalAmount?: number
    }>
  })()

  useEffect(() => {
    if (shareCombinations.length !== 1 || selectedCombinationIndex >= 0) return
    setSelectedCombinationIndex(0)
  }, [shareCombinations.length, selectedCombinationIndex])

  const checkoutParams = (
    plan: PublicRatesWithPlansPlan,
    numRooms: number,
    occupancyOverride?: number
  ) => {
    const totalAmount = Math.round(plan.totalAmount * numRooms * 100) / 100
    const marketTotal =
      plan.marketTotalAmount != null
        ? Math.round(plan.marketTotalAmount * numRooms * 100) / 100
        : undefined

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

    if (marketTotal != null && marketTotal > totalAmount) {
      p.set('marketTotal', String(marketTotal))
    }

    const occ =
      occupancyOverride ?? (occupancyParam ? parseInt(occupancyParam, 10) : undefined)

    if (occ != null) p.set('occupancy', String(occ))
    return p
  }

  return (
    <Card
      className={`overflow-hidden rounded-[2rem] border border-border/60 bg-background/55 text-card-foreground shadow-[0_24px_60px_rgba(8,17,31,0.06)] backdrop-blur-2xl dark:bg-background/30 ${soldOut ? 'ring-1 ring-rose-300/40 dark:ring-rose-700/30' : ''
        }`}
    >
      <CardContent className="p-0">
        {soldOut && (
          <div className="flex flex-wrap items-center gap-3 border-b border-rose-200/60 bg-rose-50/80 px-5 py-3 dark:border-rose-800/40 dark:bg-rose-950/25">
            <SoldOutTag />
            <span className="text-sm leading-6 text-rose-900 dark:text-rose-200">
              {noRatePlanForOccupancy
                ? `No rate plans are available for ${occupancyParam ? `${occupancyParam} guest${occupancyParam === '1' ? '' : 's'}` : 'this guest count'}.`
                : availableRooms <= 0
                  ? 'No rooms are available for these dates.'
                  : `Only ${availableRooms} room${availableRooms === 1 ? '' : 's'} available, but your search needs ${rooms}.`}
            </span>
          </div>
        )}

        <div className="p-5 sm:p-6">
          <div className="space-y-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className={`font-serif text-2xl tracking-[-0.04em] ${soldOut ? 'text-foreground/70' : 'text-foreground'}`}>
                      {name}
                    </h2>

                    {occupancy && (
                      <Badge variant="outline" className="rounded-full border-border/60 bg-background/70 text-muted-foreground dark:bg-background/35">
                        <Users className="mr-1.5 h-3.5 w-3.5" />
                        Max {occupancy}
                      </Badge>
                    )}

                    {!soldOut && showOnlyOneRoomLeft && <OnlyOneRoomLeftBadge />}
                  </div>

                  {shortDescription && (
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                      {shortDescription}
                    </p>
                  )}
                </div>


              </div>
            </div>

            {parsedRoomImages.length > 0 && (
              <EmblaImageGallery
                images={parsedRoomImages.map((img, idx) => ({
                  url: img.url,
                  alt: `${name} photo ${idx + 1}`,
                }))}
                aspectClassName="aspect-[16/11] sm:aspect-[16/9]"
                autoPlay={false}
                showThumbs={parsedRoomImages.length > 1}
              />
            )}
          </div>

          {!soldOut && !hasPlans && (
            <div className="mt-6 rounded-[1.35rem] border border-border/60 bg-background/72 px-4 py-4 backdrop-blur-xl dark:bg-background/35">
              <p className="text-sm leading-7 text-muted-foreground">
                No rate plans are currently loaded for these dates.
              </p>
            </div>
          )}

          {!soldOut && multiRoomMode && hasMultiRoomPlans && (
            <div className="mt-6 border-t border-border/60 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/80 text-sm font-medium text-foreground dark:bg-background/45">
                  1
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Choose room sharing split</div>
                  <p className="text-sm text-muted-foreground">
                    Select how your total group should be distributed across rooms.
                  </p>
                </div>
              </div>

              {shareCombinations.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {shareCombinations.map((combo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedCombinationIndex(idx)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${selectedCombinationIndex === idx
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 bg-background/72 text-foreground hover:bg-background dark:bg-background/35'
                        }`}
                    >
                      {combo.label}
                    </button>
                  ))}
                </div>
              )}

              {selectedCombination && allPlansForCombination && (
                <>
                  <Separator className="my-6 bg-border/60" />

                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/80 text-sm font-medium text-foreground dark:bg-background/45">
                      2
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Choose a meal plan</div>
                      <p className="text-sm text-muted-foreground">
                        Each plan card shows the exact room-share breakup and total.
                      </p>
                    </div>
                  </div>

                  {availableMealPlans.length === 0 && (
                    <div className="mt-4 rounded-[1.35rem] border border-amber-300/60 bg-amber-100/70 px-4 py-3 text-sm leading-7 text-amber-900 dark:bg-amber-950/25 dark:text-amber-200">
                      No common meal plan is available across this room-sharing combination.
                    </div>
                  )}

                  {mealPlanCards.length > 0 && (
                    <div className="mt-5 grid gap-4">
                      {mealPlanCards.map((card) => {
                        const mealMeta = getMealPlanMeta(card.mealPlan)

                        return (
                          <div
                            key={card.mealPlan}
                            className="rounded-[1.6rem] border border-border/60 bg-background/72 p-4 shadow-[0_14px_34px_rgba(8,17,31,0.04)] backdrop-blur-xl dark:bg-background/35 sm:p-5"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="max-w-2xl">
                                <PlanBadge mealPlan={card.mealPlan} />
                                <h3 className="mt-3 text-lg font-medium tracking-tight text-foreground">
                                  {mealMeta.short}
                                </h3>
                                <p className="mt-1.5 text-sm leading-7 text-muted-foreground">
                                  {mealMeta.description}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  {mealMeta.bullets.map((bullet) => (
                                    <span
                                      key={bullet}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground dark:bg-background/35"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      {bullet}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="rounded-[1.2rem] border border-border/60 bg-background/80 px-4 py-3 text-left dark:bg-background/45 lg:min-w-[220px] lg:text-right">
                                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                                  Total for stay
                                </div>
                                <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                                  <PriceWithMarketRate
                                    amount={card.totalAmount}
                                    marketAmount={card.marketTotalAmount}
                                    size="2xl"
                                    showTaxBreakup={true}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="mt-5 rounded-[1.25rem] border border-border/60 bg-background/70 p-4 dark:bg-background/35">
                              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                                <Info className="h-4 w-4" />
                                How this total is calculated
                              </div>

                              <div className="space-y-3">
                                {occupanciesInCombination.map((occ) => {
                                  const plan = card.defaultPlanByOcc[occ]
                                  if (!plan) return null

                                  const numRooms = selectedCombination!.breakdown[occ]
                                  const nightsOcc = getNightsForOcc(occ)
                                  const ratePerRoomPerNight =
                                    nightsOcc > 0
                                      ? Math.round((plan.totalAmount / nightsOcc) * 100) / 100
                                      : plan.totalAmount

                                  const shareLabel =
                                    occ === 1
                                      ? 'Single share'
                                      : occ === 2
                                        ? 'Double share'
                                        : occ === 3
                                          ? 'Triple share'
                                          : `${occ}-share`

                                  return (
                                    <div
                                      key={occ}
                                      className="rounded-[1rem] border border-border/60 bg-background/80 p-3 dark:bg-background/45"
                                    >
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                          <div className="text-sm font-medium text-foreground">
                                            {shareLabel}
                                          </div>
                                          <div className="mt-1 text-sm leading-6 text-muted-foreground">
                                            ₹{ratePerRoomPerNight.toFixed(2)} per room / night × {nightsOcc} night
                                            {nightsOcc !== 1 ? 's' : ''} × {numRooms} room{numRooms !== 1 ? 's' : ''}
                                          </div>
                                        </div>
                                        <div className="text-sm font-medium text-foreground">
                                          ₹{(plan.totalAmount * numRooms).toFixed(2)}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                            <div className="mt-5 flex justify-end">
                              <Button
                                color="blue"
                                className="inline-flex items-center justify-center gap-2 rounded-xl"
                                onClick={() => {
                                  const roomLines: Array<{
                                    roomTypeId: number
                                    ratePlanId: number
                                    occupancy: number
                                    tariff: number
                                  }> = []

                                  for (const occ of occupanciesInCombination) {
                                    const plan = card.defaultPlanByOcc[occ]
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
                                  }

                                  const payload = {
                                    slug,
                                    checkIn,
                                    checkOut,
                                    nights: getNightsForOcc(occupanciesInCombination[0] ?? 1),
                                    roomTypeId,
                                    roomTypeName: name,
                                    roomLines,
                                    totalAmount: card.totalAmount,
                                    marketTotal: card.marketTotalAmount,
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
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!soldOut && !multiRoomMode && hasPlans && (
            <div className="mt-6 border-t border-border/60 pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Rate plans
                  </div>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Choose the plan that matches how you want to stay, then continue to checkout.
                  </p>
                </div>

                <span className="hidden rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground dark:bg-background/35 sm:inline-flex">
                  {plans.length} option{plans.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="mt-5 grid gap-4">
                {plans.map((plan) => {
                  const numRoomsSelected = qtyByPlan[plan.plan] ?? 1
                  const totalForSelection =
                    Math.round(plan.totalAmount * numRoomsSelected * 100) / 100
                  const mealMeta = getMealPlanMeta(plan.mealPlan ?? 'EP')
                  const showTotalBreakup = !(nightsForPlans === 1 && numRoomsSelected === 1)

                  return (
                    <div
                      key={plan.plan}
                      className="rounded-[1.6rem] border border-border/60 bg-background/72 p-4 shadow-[0_14px_34px_rgba(8,17,31,0.04)] backdrop-blur-xl dark:bg-background/35 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-2xl">
                          <PlanBadge mealPlan={plan.mealPlan ?? 'EP'} />

                          <h3 className="mt-3 text-lg font-medium tracking-tight text-foreground">
                            {plan.label}
                          </h3>

                          <p className="mt-1.5 text-sm leading-7 text-muted-foreground">
                            {mealMeta.description}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {mealMeta.bullets.map((bullet) => (
                              <span
                                key={bullet}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground dark:bg-background/35"
                              >
                                <Check className="h-3.5 w-3.5" />
                                {bullet}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[1.2rem] border border-border/60 bg-background/80 px-4 py-3 text-left dark:bg-background/45 lg:min-w-[220px] lg:text-right">
                          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            Total for stay
                          </div>
                          <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                            <PriceWithMarketRate
                              amount={totalForSelection}
                              marketAmount={
                                plan.marketTotalAmount != null
                                  ? Math.round(plan.marketTotalAmount * numRoomsSelected * 100) / 100
                                  : undefined
                              }
                              size="2xl"
                              showTaxBreakup={true}
                            />
                          </div>
                        </div>
                      </div>

                      {showTotalBreakup && (
                        <div className="mt-5 rounded-[1.25rem] border border-border/60 bg-background/70 p-4 dark:bg-background/35">
                          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                            <Info className="h-4 w-4" />
                            How this total is calculated
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <BreakupItem
                              label="Rate / room / night"
                              value={
                                <PriceWithMarketRate
                                  amount={plan.averagePricePerNight}
                                  marketAmount={plan.averageMarketRatePerNight}
                                  size="sm"
                                  showTaxBreakup={false}
                                />
                              }
                            />
                            <BreakupItem
                              label="Nights"
                              value={`${nightsForPlans} night${nightsForPlans !== 1 ? 's' : ''}`}
                            />
                            <BreakupItem
                              label="Rooms selected"
                              value={`${numRoomsSelected} room${numRoomsSelected !== 1 ? 's' : ''}`}
                            />
                            <BreakupItem
                              label="Computed total"
                              value={`₹${totalForSelection.toFixed(2)}`}
                              strong
                            />
                          </div>
                        </div>
                      )}

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
                                className="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-background/45"
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

                          <span className="text-sm text-muted-foreground">
                            {numRoomsSelected} room{numRoomsSelected !== 1 ? 's' : ''} selected
                          </span>
                        </div>

                        <Link
                          href={`/book/${slug}/checkout?${checkoutParams(plan, numRoomsSelected)}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
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

function PlanBadge({ mealPlan }: { mealPlan: string }) {
  const meta = getMealPlanMeta(mealPlan)
  const Icon = meta.Icon

  return (
    <Badge
      variant="outline"
      className="rounded-full border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-foreground dark:bg-background/35"
    >
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {meta.label} · {meta.short}
    </Badge>
  )
}

function BreakupItem({
  label,
  value,
  strong = false,
}: {
  label: string
  value: React.ReactNode
  strong?: boolean
}) {
  return (
    <div className="rounded-[1rem] border border-border/60 bg-background/80 p-3 dark:bg-background/45">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className={`mt-2 text-sm ${strong ? 'font-semibold text-foreground' : 'text-foreground'}`}>
        {value}
      </div>
    </div>
  )
}
