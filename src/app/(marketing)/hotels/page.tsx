import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  MapPin,
  Mountain,
  Sparkles,
  Trees,
} from 'lucide-react'

import { getPublicProperties, getPublicPropertyBySlug } from '@/lib/api'
import { Container } from '@/components/Container'
import { Card, CardContent } from '@/components/ui/Card'

/** Extract hero image URL from property images (fallback when list API doesn't return heroImageUrl) */
function getHeroFromImages(images: unknown): string | undefined {
  if (!images || !Array.isArray(images)) return undefined
  const arr = images as Array<{ url?: string; isHero?: boolean; classification?: string }>
  const hero = arr.find((i) => i?.isHero || i?.classification === 'hero')
  return hero?.url ?? arr[0]?.url
}

/** Resolve relative image URLs (e.g. /uploads/...) to absolute using backend origin */
function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
  const origin = base.replace(/\/api\/v1.*$/, '').replace(/\/$/, '')
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`
}

export const metadata = {
  title: 'Our Hotels | Zenvana Hotels',
  description:
    'Explore the Zenvana collection in Dehradun. Thoughtfully located stays with warm hospitality and the ease of booking direct.',
}

const highlights = [
  {
    icon: MapPin,
    title: 'Well-placed stays',
    text: 'Close to Rajpur Road, city movement, and the slower edge of the foothills.',
  },
  {
    icon: Trees,
    title: 'A calmer mood',
    text: 'Stays shaped by warmth, ease, and a more relaxed rhythm of travel.',
  },
  {
    icon: BadgeCheck,
    title: 'Book direct',
    text: 'Clear communication, thoughtful value, and a smoother start to the stay.',
  },
]

export default async function HotelsPage() {
  const properties = await getPublicProperties()

  // Fallback: for properties missing heroImageUrl, fetch full detail to get hero from images
  const propertiesWithImages = await Promise.all(
    properties.map(async (p) => {
      let heroUrl = p.heroImageUrl
      if (!heroUrl) {
        const full = await getPublicPropertyBySlug(p.slug)
        heroUrl = getHeroFromImages(full?.images)
      }
      return { ...p, heroImageUrl: resolveImageUrl(heroUrl) ?? heroUrl }
    })
  )

  return (
    <main className="bg-background text-foreground">
      {/* <HotelsHero />
      <HighlightsStrip /> */}

      <section className="border-t border-border/60">
        <Container className="py-14 sm:py-16 lg:py-20">
          <div className="max-w-3xl">
            <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              The collection
            </div>
            <h2 className="mt-4 font-serif text-4xl leading-[0.95] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">
              Stay where Dehradun feels
              <span className="block">its most inviting.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              Explore the Zenvana collection through location, atmosphere, and ease of stay.
            </p>
          </div>

          {propertiesWithImages.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {propertiesWithImages.map((p) => (
                <li key={p.id}>
                  <Link href={`/hotels/${p.slug}`} className="group block h-full">
                    <Card className="h-full overflow-hidden rounded-[2rem] border-border/60 bg-card/70 text-card-foreground shadow-[0_18px_45px_rgba(8,17,31,0.05)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_26px_80px_rgba(8,17,31,0.1)] dark:bg-card/50">
                      <div className="relative overflow-hidden">
                        {p.heroImageUrl ? (
                          <img
                            src={p.heroImageUrl}
                            alt={p.publicName}
                            className="h-[320px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex h-[320px] w-full items-center justify-center bg-muted">
                            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                              <Mountain className="h-8 w-8" />
                              <span className="text-sm">Image coming soon</span>
                            </div>
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,31,0.03)_0%,rgba(8,17,31,0.14)_42%,rgba(8,17,31,0.78)_100%)]" />

                        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-white/78 backdrop-blur-md">
                            <Sparkles className="h-3.5 w-3.5 text-[#dbe64c]" />
                            Zenvana Stay
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-6 sm:p-7">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-serif text-2xl leading-tight tracking-[-0.03em] text-foreground transition-colors group-hover:text-primary">
                              {p.publicName}
                            </h3>

                            {(p.city || p.state) && (
                              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span>{[p.city, p.state].filter(Boolean).join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {p.shortDescription ? (
                          <p className="mt-5 line-clamp-3 text-sm leading-7 text-muted-foreground">
                            {p.shortDescription}
                          </p>
                        ) : (
                          <p className="mt-5 text-sm leading-7 text-muted-foreground">
                            A thoughtfully located Zenvana stay shaped by warmth, comfort, and a
                            more relaxed experience of the city.
                          </p>
                        )}

                        <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-5">
                          <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                            Explore stay
                          </span>

                          <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-transform duration-300 group-hover:translate-x-1">
                            View details
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </main>
  )
}

function HotelsHero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.06),transparent_20%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.05),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(116,195,101,0.05),transparent_20%)]" />

      <Container className="relative py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Our Hotels
          </div>

          <h1 className="mt-5 font-serif text-4xl leading-[0.95] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-7xl">
            A collection shaped by
            <span className="block">place, comfort, and quiet ease.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            Discover thoughtfully located stays across Dehradun, from the familiar movement of
            Rajpur Road to calmer foothill surrounds.
          </p>
        </div>
      </Container>
    </section>
  )
}

function HighlightsStrip() {
  return (
    <section className="border-b border-border/60 bg-background">
      <Container className="py-8 sm:py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-border/60 bg-card/60 p-5 text-card-foreground shadow-[0_12px_30px_rgba(8,17,31,0.03)] dark:bg-card/40"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-medium tracking-tight text-foreground">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

function EmptyState() {
  return (
    <div className="mt-12 overflow-hidden rounded-[2rem] border border-border/60 bg-card/70 text-card-foreground shadow-[0_18px_45px_rgba(8,17,31,0.04)] dark:bg-card/50">
      <div className="border-b border-border/60 px-6 py-5 sm:px-8">
        <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          Collection unavailable
        </div>
        <h3 className="mt-3 font-serif text-3xl tracking-[-0.04em] text-foreground">
          No hotels are showing yet.
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          The collection will appear here once public properties are available.
        </p>
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-8">
        {process.env.NODE_ENV === 'development' ? (
          <ol className="space-y-3 text-sm leading-7 text-muted-foreground">
            <li>
              Start the backend in the <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">backend</code>{' '}
              folder with{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">pnpm dev</code>{' '}
              or{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">npm run dev</code>.
            </li>
            <li>
              Set{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
                NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
              </code>{' '}
              in{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
                website/.env.local
              </code>{' '}
              and restart the Next.js dev server.
            </li>
            <li>
              Seed the database from the <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">backend</code>{' '}
              folder using{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
                npx ts-node ts/scripts/seed-zenvana-public.ts
              </code>.
            </li>
          </ol>
        ) : (
          <p className="text-sm leading-7 text-muted-foreground">
            Check back soon for the latest Zenvana stays.
          </p>
        )}
      </div>
    </div>
  )
}