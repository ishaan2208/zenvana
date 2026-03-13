'use client'

import { useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Coffee,
  MoonStar,
  Utensils,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/Button'
import { PriceWithTax } from '@/components/PriceWithTax'
import type { PublicRatesWithPlansPlan } from '@/lib/api'

type Props = {
  slug: string
  checkIn: string
  checkOut: string
  roomTypeId: string
  roomTypeName: string
  nights: string
  occupancy: string
  plans: PublicRatesWithPlansPlan[]
  availableRooms: number
  requestedRooms?: number
  initialRatePlan?: string
  initialRatePlanLabel?: string
}

const MEAL_PLAN_LABELS: Record<string, string> = {
  EP: 'Room only',
  CP: 'Breakfast included',
  MAP: 'Half board',
  AP: 'Full board',
}

export function RatePlanSelector({
  slug,
  checkIn,
  checkOut,
  roomTypeId,
  roomTypeName,
  nights,
  occupancy,
  plans,
  availableRooms,
  requestedRooms = 1,
  initialRatePlan,
}: Props) {
  const maxRooms = Math.min(Math.max(1, availableRooms), Math.max(1, requestedRooms))
  const initialPlan = initialRatePlan ? plans.find((p) => p.plan === initialRatePlan) : null

  const [selectedPlan, setSelectedPlan] = useState<PublicRatesWithPlansPlan | null>(
    initialPlan ?? (plans.length === 1 ? plans[0] : null)
  )
  const [numRooms, setNumRooms] = useState(Math.min(requestedRooms, maxRooms) || 1)

  const totalAmount = selectedPlan
    ? Math.round(selectedPlan.totalAmount * numRooms * 100) / 100
    : 0

  if (plans.length === 0) {
    return (
      <div className="rounded-[2rem] border border-border/60 bg-card/70 p-6 shadow-[0_18px_45px_rgba(8,17,31,0.04)] dark:bg-card/50 sm:p-7">
        <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          No plans available
        </div>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          No rate plans are currently available for this room and stay selection.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 text-card-foreground shadow-[0_18px_45px_rgba(8,17,31,0.05)] dark:bg-card/50">
        <div className="border-b border-border/60 px-5 py-5 sm:px-6">
          <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Select plan
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Rate plans usually vary by meal inclusion. Select the one that best suits
            your stay.
          </p>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {plans.map((plan) => {
              const isSelected = selectedPlan?.plan === plan.plan
              const mealPlan =
                plan.mealPlan && MEAL_PLAN_LABELS[plan.mealPlan]
                  ? MEAL_PLAN_LABELS[plan.mealPlan]
                  : plan.label

              return (
                <Card
                  key={plan.plan}
                  className={`cursor-pointer overflow-hidden rounded-[1.6rem] border transition-all ${isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border/60 bg-background/55 hover:border-foreground/15 dark:bg-background/35'
                    }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1 text-xs text-muted-foreground dark:bg-card/70">
                            {plan.mealPlan === 'CP' ? (
                              <Coffee className="h-3.5 w-3.5" />
                            ) : plan.mealPlan === 'MAP' || plan.mealPlan === 'AP' ? (
                              <Utensils className="h-3.5 w-3.5" />
                            ) : (
                              <MoonStar className="h-3.5 w-3.5" />
                            )}
                            {mealPlan}
                          </span>

                          {isSelected && (
                            <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-primary">
                              Selected
                            </span>
                          )}
                        </div>

                        <h3 className="mt-4 text-lg font-medium tracking-tight text-foreground">
                          {plan.label}
                        </h3>

                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          <PriceWithTax amount={plan.averagePricePerNight} suffix="/night average" size="sm" />
                        </p>
                      </div>

                      <div className="shrink-0 rounded-[1rem] border border-border/60 bg-card px-3 py-2 text-right dark:bg-card/70">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Total
                        </div>
                        <div className="mt-1 text-lg font-semibold text-foreground">
                          <PriceWithTax amount={plan.totalAmount} size="lg" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-border/60 pt-4">
                      <p className="text-xs leading-6 text-muted-foreground">
                        Total for {nights} night{nights !== '1' ? 's' : ''} · 1 room
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {selectedPlan && (
        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 text-card-foreground shadow-[0_18px_45px_rgba(8,17,31,0.05)] dark:bg-card/50">
          <div className="border-b border-border/60 px-5 py-5 sm:px-6">
            <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              Finalise selection
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Confirm the number of rooms for this plan before continuing to checkout.
            </p>
          </div>

          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="space-y-4">
                <div className="rounded-[1.4rem] border border-border/60 bg-background/55 p-4 dark:bg-background/35">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                      <BadgeCheck className="h-4.5 w-4.5" />
                    </div>

                    <div>
                      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                        Selected plan
                      </div>
                      <p className="mt-2 text-base font-medium text-foreground">
                        {selectedPlan.label}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        <PriceWithTax amount={selectedPlan.averagePricePerNight} suffix="/night" size="sm" /> ·{' '}
                        {nights} night{nights !== '1' ? 's' : ''} ·{' '}
                        <PriceWithTax amount={selectedPlan.totalAmount} suffix=" per room" size="sm" />
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-border/60 bg-background/55 p-4 dark:bg-background/35">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                      <BedDouble className="h-4.5 w-4.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                        Number of rooms
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <select
                          value={numRooms}
                          onChange={(e) => setNumRooms(Number(e.target.value))}
                          className="h-12 rounded-[1rem] border border-border/70 bg-background px-4 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-background/50"
                        >
                          {Array.from({ length: maxRooms }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>

                        <span className="text-sm text-muted-foreground">
                          room{numRooms !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {maxRooms === 1 && (
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                          Only 1 room is available for these dates.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border/60 bg-card p-5 dark:bg-card/70 lg:min-w-[260px]">
                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Total amount
                </div>

                <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                  <PriceWithTax amount={totalAmount} size="2xl" />
                </div>

                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {roomTypeName} · {numRooms} room{numRooms !== 1 ? 's' : ''} · {nights} night
                  {nights !== '1' ? 's' : ''}
                </p>

                <Button
                  href={
                    `/book/${slug}/checkout?` +
                    new URLSearchParams({
                      checkIn,
                      checkOut,
                      roomTypeId,
                      roomTypeName,
                      nights,
                      totalAmount: String(totalAmount),
                      numRooms: String(numRooms),
                      ratePlan: selectedPlan.plan,
                      ratePlanLabel: selectedPlan.label,
                      occupancy: occupancy || '1',
                    })
                  }
                  color="blue"
                  className="mt-5 h-12 w-full rounded-[1rem] text-sm font-medium"
                >
                  Continue to checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}