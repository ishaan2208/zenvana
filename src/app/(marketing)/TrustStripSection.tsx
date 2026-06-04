'use client'

import { BadgeCheck, MapPin, ShieldCheck, Star } from 'lucide-react'

import { CountUpStat } from '@/components/CountUpStat'
import { LiveBookingsCounter } from '@/components/LiveBookingsCounter'
import { useInViewOnce } from '@/hooks/useInViewOnce'

const STAGGER_MS = 120

type Props = {
  initialBookingsCount: number | null
  bookingsEndpoint: string
  /** Live property count (from getPublicProperties). Falls back to 7 if unavailable. */
  propertyCount?: number
}

export function TrustStripSection({
  initialBookingsCount,
  bookingsEndpoint,
  propertyCount,
}: Props) {
  const { ref: sectionRef, inView } = useInViewOnce({
    minRatio: 0.45,
    rootMargin: '0px 0px -12% 0px',
  })

  const propertiesStat = propertyCount && propertyCount > 0 ? propertyCount : 7

  const stats = [
    {
      icon: Star,
      tag: 'guest rating',
      sub: 'Across MakeMyTrip, Booking & Google',
      headline: (
        <CountUpStat
          active={inView}
          value={4}
          decimals={1}
          suffix="+"
          delayMs={0}
          durationMs={1900}
        />
      ),
    },
    {
      icon: BadgeCheck,
      tag: 'verified stays',
      sub: 'Across the Zenvana collection · live count',
      headline: (
        <LiveBookingsCounter
          active={inView}
          initialValue={initialBookingsCount}
          endpoint={bookingsEndpoint}
          delayMs={STAGGER_MS}
          durationMs={2100}
        />
      ),
    },
    {
      icon: MapPin,
      tag: 'properties',
      sub: 'On or near Rajpur Road, Dehradun',
      headline: (
        <CountUpStat
          active={inView}
          value={propertiesStat}
          delayMs={STAGGER_MS * 2}
          durationMs={1800}
        />
      ),
    },
    {
      icon: ShieldCheck,
      tag: 'when you book direct',
      sub: 'Match-or-beat any public OTA price',
      headline: 'Best rate',
    },
  ]

  return (
    <section
      ref={sectionRef}
      className="border-y border-border/60 bg-card/40"
    >
      <div className="container-shell py-6 sm:py-8 lg:py-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {stats.map(({ icon: Icon, headline, tag, sub }) => (
            <div
              key={tag}
              className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 sm:px-5 sm:py-4"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  {tag}
                </div>
                <div className="mt-0.5 font-serif text-xl tracking-[-0.02em] text-foreground sm:text-2xl">
                  {headline}
                </div>
                <div className="mt-1 hidden text-xs leading-5 text-muted-foreground sm:block">
                  {sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
