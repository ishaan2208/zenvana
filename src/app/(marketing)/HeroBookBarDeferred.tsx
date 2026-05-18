'use client'

import { useEffect, useState } from 'react'

import { HeroBookBar, type HeroBookBarProperty } from './HeroBookBar'

/**
 * Mounts the booking bar after the first animation frame so Radix Select/Popover
 * layout measurements do not interleave with the hero’s initial layout pass
 * (reduces forced synchronous layout / reflow contention on load).
 */
export function HeroBookBarDeferred({ properties }: { properties: HeroBookBarProperty[] }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (!ready) {
    return (
      <div className="w-full" aria-busy="true">
        <div className="flex min-h-[11rem] flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-3 shadow-sm sm:min-h-[4.5rem] sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <div className="h-10 flex-1 animate-pulse rounded-md bg-white/10 sm:min-w-[8rem]" />
          <div className="h-10 flex-1 animate-pulse rounded-md bg-white/10 sm:min-w-[7rem]" />
          <div className="h-10 flex-1 animate-pulse rounded-md bg-white/10 sm:min-w-[7rem]" />
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <div className="h-10 w-20 animate-pulse rounded-md bg-white/10 sm:w-[90px]" />
            <div className="h-10 w-24 animate-pulse rounded-md bg-white/10 sm:w-[120px]" />
            <div className="h-10 min-w-[6rem] flex-1 animate-pulse rounded-md bg-white/10 sm:flex-initial sm:w-24" />
          </div>
        </div>
      </div>
    )
  }

  return <HeroBookBar properties={properties} />
}
