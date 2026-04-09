'use client'

import { PriceWithMarketRate } from '@/components/PriceWithMarketRate'

type Props = {
  amount: number
  marketAmount?: number
}

/** Hotels grid: market strikethrough + direct + GST + % off, same as booking RoomCard. */
export function HotelListingPlanPrice({ amount, marketAmount }: Props) {
  return (
    <div className="min-w-0 text-right">
      <PriceWithMarketRate
        amount={amount}
        marketAmount={marketAmount}
        size="sm"
        showTaxBreakup={false}
        discountVariant="badge"
      />
    </div>
  )
}
