import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Crown, Gem, Leaf } from 'lucide-react'

import { PropertyCardImageSlideshow } from '@/components/PropertyCardImageSlideshow'
import { Reveal } from '@/components/motion/Reveal'
import type { PublicPropertyListItem } from '@/lib/api'
import {
  buildPyramidCardData,
  fallbackPyramidProperties,
  PYRAMID_TIER_ORDER,
  type PyramidTier,
} from '@/lib/pyramid-cards'

const TIER_META: Record<
  PyramidTier,
  { label: string; tagline: string; pillClass: string; ringClass: string; icon: typeof Leaf }
> = {
  essential: {
    label: 'Essential',
    tagline: 'Considered value, built around comfort.',
    pillClass: 'tier-pill tier-pill-essential',
    ringClass: 'ring-1 ring-tier-essential/30',
    icon: Leaf,
  },
  refined: {
    label: 'Refined',
    tagline: 'A little more space, a little more quiet.',
    pillClass: 'tier-pill tier-pill-refined',
    ringClass: 'ring-1 ring-tier-refined/40',
    icon: Gem,
  },
  signature: {
    label: 'Signature',
    tagline: 'Our most considered, slow-paced stays.',
    pillClass: 'tier-pill tier-pill-signature',
    ringClass: 'ring-1 ring-tier-signature/45',
    icon: Crown,
  },
}

const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six',
  'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
]
function countWord(n: number): string {
  const w = NUMBER_WORDS[n] ?? String(n)
  return w.charAt(0).toUpperCase() + w.slice(1)
}

type Props = {
  properties: PublicPropertyListItem[]
}

export async function PropertyPyramidSection({ properties }: Props) {
  // Roster comes from the live backend (single source of truth). Fall back to
  // the curated set only if the API is unreachable, so the collection is never blank.
  const roster = properties.length > 0 ? properties : fallbackPyramidProperties()
  const cards = await buildPyramidCardData(roster)
  const grouped = PYRAMID_TIER_ORDER.map((tier) => ({
    tier,
    items: cards.filter((p) => p.tier === tier),
  })).filter((g) => g.items.length > 0)

  return (
    <section id="collection" className="section-rule bg-background">
      <div className="container-shell section-pad">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="editorial-display text-3xl font-semibold sm:text-4xl lg:text-5xl">
              {countWord(cards.length)} hotels. One quiet stretch of road.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Pick the room that fits the trip. Every property is on or near Rajpur Road —
              you don&apos;t lose anything by choosing differently.
            </p>
          </div>
          <Link href="/hotels" className="site-button-light w-fit md:mt-2">
            Compare all hotels
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 space-y-12 sm:space-y-16">
          {grouped.map(({ tier, items }) => {
            const meta = TIER_META[tier]
            const Icon = meta.icon
            return (
              <div key={tier}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className={meta.pillClass}>
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                    <span className="text-sm text-muted-foreground sm:text-base">
                      {meta.tagline}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-2">
                  {items.map((item, i) => {
                    const href = `/hotels/${item.slug}`
                    const alt = `${item.name} by Zenvana — ${meta.label} stay in Dehradun`
                    const priority = item.slug === 'rosewood'

                    return (
                      <Reveal key={item.slug} delay={i * 70}>
                      <Link
                        href={href}
                        className={`group relative block overflow-hidden rounded-[1.75rem] border border-border/60 bg-card transition-[transform,box-shadow] duration-500 ease-editorial hover:-translate-y-1 hover:shadow-editorial ${meta.ringClass}`}
                      >
                        <div className="relative aspect-[16/11] overflow-hidden">
                          <div className="absolute inset-0 transition-transform duration-700 ease-editorial group-hover:scale-[1.04]">
                          {item.imageUrls.length > 1 ? (
                            <PropertyCardImageSlideshow
                              urls={item.imageUrls}
                              alt={alt}
                              priority={priority}
                            />
                          ) : item.imageUrls.length === 1 ? (
                            <Image
                              src={item.imageUrls[0]}
                              alt={alt}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              loading={priority ? 'eager' : 'lazy'}
                              fetchPriority={priority ? 'high' : 'auto'}
                              quality={65}
                              unoptimized={item.imageUrls[0]?.startsWith('http')}
                              className="object-cover"
                            />
                          ) : (
                            // No backend or curated photo — branded gradient, never a fabricated image.
                            <div className="flex h-full w-full items-center justify-center bg-ink-gradient">
                              <span className="editorial-display text-6xl text-white/80">
                                {item.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          </div>
                          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_30%,rgba(0,0,0,0.45)_100%)]" />
                          <span
                            className={`${meta.pillClass} absolute left-4 top-4 z-[1] backdrop-blur`}
                          >
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </span>
                        </div>
                        <div className="flex flex-col gap-3 p-5 sm:p-6">
                          <div className="flex items-baseline justify-between gap-3">
                            <h3 className="editorial-display text-2xl text-foreground sm:text-3xl">
                              {item.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground/80 transition group-hover:translate-x-0.5 group-hover:text-foreground">
                              Explore
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                          {item.intent ? (
                            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                              {item.intent}
                            </p>
                          ) : null}
                        </div>
                      </Link>
                      </Reveal>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
