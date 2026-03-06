'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/Button'

type RoomCardProps = {
  slug: string
  checkIn: string
  checkOut: string
  occupancyParam: string
  roomTypeId: number
  name: string
  occupancy: string | null
  shortDescription: string | null
  availableRooms: number
  nights: number
  averagePricePerNight: number
}

export function RoomCard({
  slug,
  checkIn,
  checkOut,
  occupancyParam,
  roomTypeId,
  name,
  occupancy,
  shortDescription,
  availableRooms,
  nights,
  averagePricePerNight,
}: RoomCardProps) {
  const params = new URLSearchParams({
    checkIn,
    checkOut,
    roomTypeId: String(roomTypeId),
    roomTypeName: name,
    availableRooms: String(Math.max(0, availableRooms)),
  })
  if (occupancyParam) params.set('occupancy', occupancyParam)

  const soldOut = availableRooms <= 0

  return (
    <Card className={`overflow-hidden ${soldOut ? 'border-amber-200 bg-slate-50/80' : ''}`}>
      <CardContent className="p-0">
        {soldOut && (
          <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-800">
            Sold out — no rooms available for these dates
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
            <div className="shrink-0 text-right">
              {soldOut ? (
                <p className="mt-3 font-medium text-amber-600">Sold out</p>
              ) : (
                <>
                  <p className="text-sm text-slate-500">
                    From ₹{averagePricePerNight.toLocaleString('en-IN')}/night (avg)
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {nights} night{nights !== 1 ? 's' : ''} · choose rate plan & rooms on next step
                  </p>
                  <Button
                    href={`/book/${slug}/rate-plan?${params}`}
                    color="blue"
                    className="mt-3"
                  >
                    Select & choose rate plan
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
