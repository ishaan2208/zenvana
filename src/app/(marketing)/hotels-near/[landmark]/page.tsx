import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  MapPin,
  Phone,
  Sparkles,
} from 'lucide-react'

import { Container } from '@/components/Container'
import { JsonLd } from '@/components/JsonLd'
import {
  breadcrumbJsonLd,
  hotelGroupJsonLd,
  itemListJsonLd,
} from '@/lib/structured-data'
import { getPublicProperties, getPublicPropertyBySlug } from '@/lib/api'
import { pickHeroAndGallery } from '@/lib/media'
import {
  estimateDriveMinutes,
  formatDistance,
  getAllLandmarks,
  getLandmarkBySlug,
  ratePropertiesByDistance,
  type PropertyDistance,
} from '@/lib/landmarks'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

export const revalidate = 86400
export const dynamicParams = true

type Props = {
  params: Promise<{ landmark: string }>
}

export async function generateStaticParams() {
  const all = await getAllLandmarks()
  return all.map((l) => ({ landmark: l.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { landmark } = await params
  const lm = await getLandmarkBySlug(landmark)
  if (!lm) {
    return {
      title: 'Hotels near landmark · Zenvana Hotels Dehradun',
      robots: { index: false, follow: true },
    }
  }
  const title = `Hotels near ${lm.name}, Dehradun · Zenvana`
  const description = `Boutique hotels near ${lm.name} on or around Rajpur Road, Dehradun. Compare the Zenvana collection by distance, mood, and price. Book direct for the best rate.`
  return {
    title,
    description,
    keywords: [
      `hotels near ${lm.name}`,
      `${lm.name} hotels Dehradun`,
      `stay near ${lm.name}`,
      `boutique hotel near ${lm.name}`,
      'hotels in Dehradun',
      'Rajpur Road hotels',
    ],
    alternates: { canonical: `/hotels-near/${landmark}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/hotels-near/${landmark}`,
      type: 'website',
    },
  }
}

const SEED_FAQ_TEMPLATES = (name: string) => [
  {
    question: `How far are Zenvana Hotels from ${name}?`,
    answer: `Our properties are clustered on or near Rajpur Road, Dehradun. The distance to ${name} varies by hotel — the table on this page shows estimated distance and drive time for each one. Most stays sit within a 15-minute drive of common Dehradun anchors.`,
  },
  {
    question: `Which Zenvana hotel is closest to ${name}?`,
    answer: `The list above is sorted by estimated distance from ${name}, so the property at the top is the nearest in our collection. For a personalised recommendation based on travel time at your time of day, message us via the contact page or call reservations.`,
  },
  {
    question: `Can you arrange transport to ${name} from the hotel?`,
    answer: `Yes — paid transport (cabs and shared vehicles) can be arranged through reception. Direct guests can request this when booking; we will quote the rate ahead of time so there are no surprises at check-out.`,
  },
  {
    question: 'Are Zenvana Hotels good for short visits to Dehradun?',
    answer: 'Yes. The collection is designed for both short city stops and longer leisure stays. The Essential tier (Rosewood) is the most popular pick for one- and two-night business or transit stays.',
  },
]

export default async function HotelsNearLandmarkPage({ params }: Props) {
  const { landmark } = await params
  const lm = await getLandmarkBySlug(landmark)
  if (!lm) notFound()

  const list = await getPublicProperties()

  // Pull full details (for lat/lng) only for current properties — stays cached.
  const details = await Promise.all(
    list.map(async (p) => {
      const d = await getPublicPropertyBySlug(p.slug).catch(() => null)
      return { listItem: p, detail: d }
    }),
  )

  const heroResolver = (slug: string) => {
    const row = details.find((d) => d.listItem.slug === slug)
    if (row?.listItem.heroImageUrl) return row.listItem.heroImageUrl
    if (row?.detail) return pickHeroAndGallery(row.detail.images).heroUrl
    return undefined
  }

  const ratedProperties: PropertyDistance[] = ratePropertiesByDistance(
    lm,
    details.map((d) =>
      d.detail
        ? {
          slug: d.detail.slug,
          publicName: d.detail.publicName,
          city: d.detail.city,
          state: d.detail.state,
          latitude: d.detail.latitude,
          longitude: d.detail.longitude,
          descriptionShort: d.detail.descriptionShort,
          images: d.detail.images,
        }
        : {
          slug: d.listItem.slug,
          publicName: d.listItem.publicName,
          city: d.listItem.city ?? undefined,
          state: d.listItem.state ?? undefined,
          latitude: undefined,
          longitude: undefined,
          descriptionShort: d.listItem.shortDescription ?? undefined,
          images: undefined,
        },
    ),
    heroResolver,
  )

  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Hotels', url: `${SITE_URL}/hotels` },
    { name: `Near ${lm.name}`, url: `${SITE_URL}/hotels-near/${lm.slug}` },
  ]

  const groupSchema = hotelGroupJsonLd(
    ratedProperties.map((p) => ({
      slug: p.slug,
      publicName: p.publicName,
      heroImageUrl: p.heroImageUrl,
    })),
  )

  const listSchema = itemListJsonLd({
    name: `Zenvana Hotels near ${lm.name}, Dehradun`,
    url: `${SITE_URL}/hotels-near/${lm.slug}`,
    items: ratedProperties.map((p) => ({
      name: p.publicName,
      url: `${SITE_URL}/hotels/${p.slug}`,
      image: p.heroImageUrl,
      description:
        p.distanceKm != null
          ? `${formatDistance(p.distanceKm)} from ${lm.name} · ${estimateDriveMinutes(p.distanceKm)}`
          : p.shortDescription,
    })),
  })

  const faqs = SEED_FAQ_TEMPLATES(lm.name)

  return (
    <main className="mobile-cta-pad bg-background text-foreground">
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), groupSchema, listSchema]} />

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink-gradient text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-soft-light">
          <div className="h-full w-full bg-[radial-gradient(circle_at_18%_30%,_rgba(200,168,90,0.35),transparent_45%),radial-gradient(circle_at_82%_60%,_rgba(30,72,143,0.45),transparent_45%)]" />
        </div>
        <Container className="relative py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.28em] text-white/82 backdrop-blur">
              <MapPin className="h-3 w-3 text-gold-200" />
              {lm.category ?? 'Dehradun'} · Rajpur Road area
            </div>
            <h1 className="editorial-display mt-6 text-4xl font-semibold leading-[0.96] sm:text-5xl lg:text-6xl">
              Hotels near <span className="gold-text">{lm.name}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/82 sm:text-lg sm:leading-8">
              The Zenvana collection sits a short drive from {lm.name}, with five
              boutique hotels on or near Rajpur Road. Below: every property sorted by
              estimated distance, with photos, drive time, and direct booking.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="#hotels"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-300 px-5 py-3 text-sm font-medium text-ink-800 transition hover:bg-gold-200"
              >
                <CalendarCheck className="h-4 w-4" />
                See nearest hotels
              </Link>
              <Link
                href="/hotels"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/14"
              >
                Browse all properties
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* HOTELS LIST */}
      <section id="hotels" className="section-rule scroll-mt-24">
        <Container className="section-pad-lg">
          <div className="max-w-2xl">
            <div className="editorial-eyebrow">Sorted by estimated distance</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              The closest stays, ranked.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              Distances are great-circle estimates from {lm.name}. Drive times assume
              average Dehradun traffic.
            </p>
          </div>

          {ratedProperties.length === 0 ? (
            <div className="mt-10 rounded-[1.75rem] border border-border/60 bg-card/70 p-8 text-center">
              <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                We are still building this map. In the meantime, our full collection is
                a short drive from {lm.name}.
              </p>
              <Link
                href="/hotels"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background"
              >
                Browse all hotels
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-10 space-y-4 sm:space-y-5">
              {ratedProperties.map((p, idx) => (
                <PropertyCard key={p.slug} rank={idx + 1} property={p} landmark={lm.name} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* WHY THIS AREA */}
      <section className="section-rule bg-card/40">
        <Container className="section-pad-lg">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <div className="editorial-eyebrow">About the area</div>
              <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
                Why guests choose to stay near {lm.name}.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Staying close to {lm.name} usually means easier mornings, fewer cab
                rides, and the kind of local familiarity that makes a short Dehradun
                visit feel longer. Rajpur Road is the natural base — it sits between the
                city and the foothills and keeps both within reach.
              </p>
            </div>
            <div className="lg:col-span-7">
              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  'Easy access to Rajpur Road cafés and local shopping',
                  'Short drive to the foothills and Mussoorie',
                  'Multiple property options across price points',
                  'Direct hotel-to-property transport on request',
                  'Family-friendly rooms with crib and connecting options',
                  'In-house F&B at Feasta — open to non-residents',
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-3 rounded-[1.2rem] border border-border/60 bg-background/85 p-4 text-sm leading-7 text-foreground/90 sm:p-5"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="section-rule">
        <Container className="section-pad-lg">
          <div className="mx-auto max-w-3xl text-center">
            <div className="editorial-eyebrow">Useful to know</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              Practical answers, before you book.
            </h2>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="group quiet-card p-5 sm:p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium tracking-tight text-foreground sm:text-lg">
                  <span>{faq.question}</span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="section-rule">
        <Container className="section-pad">
          <div className="overflow-hidden rounded-[2rem] bg-signature-gradient px-6 py-12 text-white sm:px-8 sm:py-14 lg:px-10 lg:py-16">
            <div className="text-center">
              <div className="editorial-eyebrow text-white/70">Ready to stay nearby?</div>
              <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
                The closest hotel to {lm.name} is waiting.
              </h2>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/hotels"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-300 px-5 py-3 text-sm font-medium text-ink-800 transition hover:bg-gold-200"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Browse hotels
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/16"
                >
                  Talk to reservations
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Mobile sticky CTA */}
      <div className="mobile-cta-bar lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <a
            href="tel:+919084051774"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-foreground"
            aria-label="Call Zenvana Hotels"
          >
            <Phone className="h-4.5 w-4.5" />
          </a>
          <Link
            href="/hotels"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background"
          >
            <CalendarCheck className="h-4 w-4" />
            See hotels near {lm.name}
          </Link>
        </div>
      </div>
    </main>
  )
}

function PropertyCard({
  rank,
  property,
  landmark,
}: {
  rank: number
  property: PropertyDistance
  landmark: string
}) {
  const location = [property.city, property.state].filter(Boolean).join(', ')
  return (
    <Link
      href={`/hotels/${property.slug}`}
      className="group grid grid-cols-1 overflow-hidden rounded-[1.6rem] border border-border/60 bg-card/80 transition duration-500 ease-editorial hover:-translate-y-0.5 hover:border-gold-300/40 hover:shadow-editorial sm:grid-cols-[260px_1fr] dark:bg-card/60"
    >
      <div className="relative aspect-[16/11] overflow-hidden bg-muted sm:aspect-auto">
        {property.heroImageUrl ? (
          <Image
            src={property.heroImageUrl}
            alt={`${property.publicName} by Zenvana — near ${landmark}`}
            fill
            sizes="(max-width: 640px) 100vw, 260px"
            className="object-cover transition duration-700 ease-editorial group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-muted text-sm text-muted-foreground">
            Image coming soon
          </div>
        )}
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-foreground/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-background backdrop-blur">
          <Sparkles className="h-3 w-3" />
          {rank === 1 ? 'Closest' : `#${rank}`}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="font-serif text-2xl tracking-[-0.02em] text-foreground sm:text-3xl">
            {property.publicName}
          </h3>
          {location && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {location}
            </span>
          )}
        </div>

        {property.shortDescription && (
          <p className="mt-3 line-clamp-2 text-sm leading-7 text-muted-foreground sm:text-base">
            {property.shortDescription}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-[1rem] border border-border/60 bg-background/85 px-3 py-2 text-center">
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Distance
            </div>
            <div className="mt-1 font-serif text-base text-foreground">
              {formatDistance(property.distanceKm)}
            </div>
          </div>
          <div className="rounded-[1rem] border border-border/60 bg-background/85 px-3 py-2 text-center">
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Drive time
            </div>
            <div className="mt-1 font-serif text-base text-foreground">
              {estimateDriveMinutes(property.distanceKm)}
            </div>
          </div>
          <div className="col-span-2 inline-flex items-center justify-center gap-2 rounded-[1rem] bg-foreground px-3 py-2.5 text-sm font-medium text-background transition group-hover:opacity-95 sm:col-span-1">
            View hotel
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  )
}
