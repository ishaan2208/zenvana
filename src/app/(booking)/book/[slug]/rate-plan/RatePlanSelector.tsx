'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/Button'
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

  const totalAmount = selectedPlan ? Math.round(selectedPlan.totalAmount * numRooms * 100) / 100 : 0

  return (
    <div className="mt-8 space-y-6">
      <p className="text-sm text-slate-600">
        Select a rate plan (meal inclusion). Then choose number of rooms.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.plan}
            className={`cursor-pointer overflow-hidden transition-all ${
              selectedPlan?.plan === plan.plan
                ? 'ring-2 ring-blue-500'
                : 'hover:border-slate-300'
            }`}
            onClick={() => setSelectedPlan(plan)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{plan.label}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    ₹{plan.averagePricePerNight.toLocaleString('en-IN')}/night avg
                  </p>
                </div>
                <p className="font-semibold text-slate-900">
                  ₹{plan.totalAmount.toLocaleString('en-IN')}
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Total for {nights} night{nights !== '1' ? 's' : ''} · 1 room
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlan && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="font-semibold text-slate-900">Number of rooms</h3>
          <select
            value={numRooms}
            onChange={(e) => setNumRooms(Number(e.target.value))}
            className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {Array.from({ length: maxRooms }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {maxRooms === 1 && (
            <p className="mt-1 text-sm text-slate-500">Only 1 room available for these dates.</p>
          )}
          <p className="mt-4 text-lg font-semibold text-slate-900">
            Total: ₹{totalAmount.toLocaleString('en-IN')}
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
            className="mt-4"
          >
            Continue to checkout
          </Button>
        </div>
      )}
    </div>
  )
}
