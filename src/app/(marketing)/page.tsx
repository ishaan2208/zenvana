import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Clock,
  Crown,
  Gem,
  Leaf,
  MapPin,
  MapPinned,
  PartyPopper,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import { HomeLimewoodMap } from '@/components/HomeLimewoodMap'
import type { PublicPropertyListItem } from '@/lib/api'
import {
  getPublicBookingsCount,
  getPublicProperties,
  getPublicPropertyBySlug,
} from '@/lib/api'
import { HeroBookBar } from './HeroBookBar'
import { JsonLd } from '@/components/JsonLd'
import { LiveBookingsCounter } from '@/components/LiveBookingsCounter'
import { GuestVoicesSection } from '@/components/GuestVoicesSection'
import { faqPageJsonLd, hotelGroupJsonLd } from '@/lib/structured-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Zenvana Hotels · Boutique stays on Rajpur Road, Dehradun',
  description:
    'A quietly considered collection of boutique hotels on Rajpur Road, Dehradun. Owner-operated, family-friendly, and built for calm. Book direct for the best rate.',
  keywords: [
    'best hotel in Dehradun',
    'boutique hotel Dehradun',
    'Rajpur Road hotels',
    'hotels in Dehradun',
    'family hotels Dehradun',
    'hotels near Mussoorie',
    'wedding venue Dehradun',
    'rooftop restaurant Dehradun',
    'Zenvana Hotels',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Zenvana Hotels · Boutique stays on Rajpur Road, Dehradun',
    description:
      'Owner-operated boutique hotels in Dehradun. Calm interiors, real hospitality, and direct-booking value.',
    url: SITE_URL,
    type: 'website',
  },
}

const HOME_FAQS = [
  {
    question: 'Where exactly are Zenvana Hotels in Dehradun located?',
    answer:
      'All Zenvana properties are on or near Rajpur Road, Dehradun — about 15 minutes from the city centre and 35–45 minutes from Mussoorie. The exact address for each hotel is on its individual property page.',
  },
  {
    question: 'How many properties are in the Zenvana collection?',
    answer:
      'Zenvana operates a small collection of boutique hotels — Rosewood, Silkwood, Monte Verde, Silverwood, and Cherrywood — each with its own character and price point, all on or near Rajpur Road.',
  },
  {
    question: 'Why book direct on zenvanahotels.com instead of OTAs?',
    answer:
      'Direct bookings get our best public rate, faster confirmation, easier date changes, and direct coordination with the property team for early check-ins, room preferences, or airport transfers.',
  },
  {
    question: 'Are Zenvana Hotels family-friendly?',
    answer:
      'Yes. Most of our rooms accept up to two adults and one child, and we have triple and connecting room options across the collection. Cribs, early breakfast, and quiet floors are arranged on request.',
  },
  {
    question: 'Do you have a restaurant on site?',
    answer:
      'Yes — Feasta by Zenvana is our rooftop restaurant on Rajpur Road, open daily for breakfast, lunch, and dinner. The kitchen serves North Indian, continental, and Chinese options, and is open to non-residents.',
  },
  {
    question: 'Can Zenvana host weddings or corporate events?',
    answer:
      'Yes. With multiple properties on the same road we can absorb 50+ rooms and host weddings, corporate offsites, and private celebrations as a single combined venue. Email us via the contact page for an event proposal.',
  },
  {
    question: 'How far is Zenvana from Dehradun airport (DED) and ISBT?',
    answer:
      'Jolly Grant Airport (DED) is roughly 45 minutes by car and ISBT/Dehradun railway station is 20–25 minutes. We can arrange paid airport transfers on request when you book direct.',
  },
  {
    question: 'What are check-in and check-out times?',
    answer:
      'Standard check-in is 1:00 PM and standard check-out is 11:00 AM. Early check-in or late check-out can usually be arranged subject to availability — easier to confirm if you book direct.',
  },
]

/* ──────────────────────────────────────────────────────────────
 * Property pyramid — Essential / Refined / Signature
 * Mapping is editable; defaults reflect operator's intent.
 * ────────────────────────────────────────────────────────────── */
type Tier = 'essential' | 'refined' | 'signature'

type PyramidEntry = {
  name: string
  slug: string
  tier: Tier
  imageSrc: string
  intent: string
}

const PYRAMID_CONFIG: PyramidEntry[] = [
  {
    name: 'Rosewood',
    slug: 'rosewood',
    tier: 'essential',
    imageSrc: '/images/dehradun/Rosewood.png',
    intent: 'A clean, light-led entry stay — designed around the bed, the morning, and the road back into the city.',
  },
  {
    name: 'Silkwood',
    slug: 'silkwood',
    tier: 'refined',
    imageSrc: '/images/dehradun/silkwood .png',
    intent: 'A few quiet steps up — softer materials, more space, and the kind of room that suits longer evenings.',
  },
  {
    name: 'Cherrywood',
    slug: 'cherrywood',
    tier: 'refined',
    imageSrc: '/images/dehradun/cherrwood building pic 1.png',
    intent: 'A higher vantage point, calmer evenings, and a slower city to watch from above.',
  },
  {
    name: 'Monte Verde',
    slug: 'monteverde',
    tier: 'signature',
    imageSrc: '/images/dehradun/MonteVerde.png',
    intent: 'Our most considered stay — generous proportions, soft lighting, and a rhythm built for unhurried days.',
  },
  {
    name: 'Silverwood',
    slug: 'silverwood',
    tier: 'signature',
    imageSrc: '/images/dehradun/SILVER W BUILDING PIC.png',
    intent: 'Framed views of the foothills and a quieter pace — the room you choose when the trip itself is the point.',
  },
]

const TIER_META: Record<
  Tier,
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

function resolvePyramidHref(slug: string, properties: PublicPropertyListItem[]) {
  const hit = properties.find((p) => p.slug === slug)
  return hit ? `/hotels/${hit.slug}` : '/hotels'
}

const TRUST_OWNER_USER_ID = 1
const BOOKINGS_ENDPOINT = `/api/public/bookings-count?userId=${TRUST_OWNER_USER_ID}`

export default async function HomePage() {
  const properties = await getPublicProperties()
  const limewood = await getPublicPropertyBySlug('limewood')
  const initialBookingsCount = await getPublicBookingsCount(TRUST_OWNER_USER_ID)
  const heroProperties = properties.map((p) => ({
    slug: p.slug,
    publicName: p.publicName,
  }))
  const groupProperties = properties.map((p) => ({
    slug: p.slug,
    publicName: p.publicName,
    heroImageUrl: p.heroImageUrl ?? undefined,
  }))

  return (
    <div className="mobile-cta-pad">
      <JsonLd
        data={[
          hotelGroupJsonLd(groupProperties),
          faqPageJsonLd(HOME_FAQS),
        ]}
      />

      <HeroSection properties={heroProperties} />
      <TrustStripSection initialBookingsCount={initialBookingsCount} />
      <WhyZenvanaSection />
      <PropertyPyramidSection properties={properties} />
      <StayDirectSection />
      <DiningSection />
      <WeddingsTeaserSection />
      <GallerySection />
      <GuestVoicesSection />
      <PressTrustStrip />
      <LocationSection
        latitude={limewood?.latitude}
        longitude={limewood?.longitude}
        mapPlaceUrl={limewood?.googleMapPlaceUrl}
      />
      <HomeFaqSection />
      <BookingCtaSection />

      <MobileBookingCta />
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
 * HERO
 * ────────────────────────────────────────────────────────────── */
function HeroSection({
  properties,
}: {
  properties: { slug: string; publicName: string }[]
}) {
  return (
    <section className="relative min-h-[92svh] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/dehradun/dehradun-hero.jpg"
          alt="Dehradun foothills and Rajpur Road atmosphere at golden hour"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-hero-shade" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_60%),repeating-linear-gradient(135deg,_rgba(255,255,255,0.06),_rgba(255,255,255,0.06)_1px,_transparent_1px,_transparent_10px)]" />
        </div>
      </div>

      <div className="container-shell relative flex min-h-[92svh] flex-col items-center justify-end pb-10 pt-32 sm:items-center sm:justify-center sm:pb-12 lg:pb-24">
        <div className="relative z-10 mx-auto max-w-4xl text-center text-white animate-fade-up">
          <div className="space-y-5 sm:space-y-6 lg:space-y-7">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.28em] text-white/82 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-gold-200" />
              Boutique stays · Rajpur Road, Dehradun
            </div>

            <h1 className="editorial-display max-w-3xl text-[clamp(2.25rem,7vw,5.25rem)] font-semibold leading-[0.94] text-white">
              A quieter way to stay in <span className="gold-text">Dehradun</span>.
            </h1>

            <p className="mx-auto max-w-xl text-sm leading-7 text-white/85 sm:text-base lg:text-lg">
              Owner-operated boutique hotels at the foothills of Mussoorie. Calm interiors,
              real hospitality, direct-booking value.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-8 w-full max-w-6xl px-2 mx-auto sm:mt-10 sm:px-4">
          <HeroBookBar properties={properties} />
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
 * TRUST STRIP — under hero
 * ────────────────────────────────────────────────────────────── */
function TrustStripSection({
  initialBookingsCount,
}: {
  initialBookingsCount: number | null
}) {
  type StatCard = {
    icon: typeof Star
    headline: React.ReactNode
    tag: string
    sub: string
  }
  const stats: StatCard[] = [
    {
      icon: Star,
      headline: '4.0+',
      tag: 'guest rating',
      sub: 'Across MakeMyTrip, Booking & Google',
    },
    {
      icon: BadgeCheck,
      headline: (
        <LiveBookingsCounter
          initialValue={initialBookingsCount}
          endpoint={BOOKINGS_ENDPOINT}
        />
      ),
      tag: 'verified stays',
      sub: 'Across the Zenvana collection · live count',
    },
    {
      icon: MapPin,
      headline: '5',
      tag: 'properties',
      sub: 'On or near Rajpur Road, Dehradun',
    },
    {
      icon: ShieldCheck,
      headline: 'Best rate',
      tag: 'when you book direct',
      sub: 'Match-or-beat any public OTA price',
    },
  ]

  return (
    <section className="border-y border-border/60 bg-card/40">
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

/* ──────────────────────────────────────────────────────────────
 * WHY ZENVANA — H1-equivalent SEO + owner-operator narrative
 * ────────────────────────────────────────────────────────────── */
function WhyZenvanaSection() {
  return (
    <section className="section-rule bg-background">
      <div className="container-shell section-pad">
        <div className="mx-auto max-w-4xl text-center text-foreground">
          <div className="editorial-eyebrow">A note from the owner</div>
          <div className="rule-gold mt-3" />
          <h2 className="editorial-display mt-6 text-3xl font-semibold sm:text-4xl lg:text-5xl">
            Best Hotel in Dehradun · Zenvana on Rajpur Road
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            A serene boutique collection at the foothills of Mussoorie.
          </p>

          <div className="mx-auto mt-8 max-w-3xl space-y-5 text-left text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
            <p>
              Zenvana started with a simple idea: most hotels in Dehradun ask you to
              compromise. Either the building is beautiful and the service distant, or the
              service is warm and the room feels franchised. We wanted a small collection of
              hotels where neither half had to give in.
            </p>
            <p>
              Today we run five properties on or around{' '}
              <a
                href="https://en.wikipedia.org/wiki/Rajpur_Road"
                target="_blank"
                rel="noreferrer"
                className="underline-gold underline-offset-4 hover:text-foreground"
              >
                Rajpur Road
              </a>
              {' '}— each with its own character, but all owner-operated, all on the same
              quiet stretch of city, and all built for the kind of guest who notices when a
              morning is unhurried.
            </p>
            <p>
              You will find the names of our hotels on this page. The pages they lead to are
              honest — real photos, real rooms, and the kind of pricing we will defend if
              you book direct. We hope it gives Dehradun the gentler welcome it has always
              deserved.
            </p>
            <p className="font-serif text-base text-foreground">
              — The Zenvana team
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
 * PROPERTY PYRAMID — Essential / Refined / Signature
 * ────────────────────────────────────────────────────────────── */
function PropertyPyramidSection({ properties }: { properties: PublicPropertyListItem[] }) {
  const tiers: Tier[] = ['essential', 'refined', 'signature']
  const grouped = tiers.map((tier) => ({
    tier,
    items: PYRAMID_CONFIG.filter((p) => p.tier === tier),
  }))

  return (
    <section id="collection" className="section-rule bg-background">
      <div className="container-shell section-pad">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="editorial-eyebrow">The collection</div>
            <h2 className="editorial-display mt-4 text-3xl font-semibold sm:text-4xl lg:text-5xl">
              Five hotels. One quiet stretch of road.
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
                  {items.map((item) => {
                    const href = resolvePyramidHref(item.slug, properties)
                    return (
                      <Link
                        key={item.slug}
                        href={href}
                        className={`group relative block overflow-hidden rounded-[1.75rem] border border-border/60 bg-card transition duration-500 ease-editorial hover:-translate-y-1 hover:shadow-editorial ${meta.ringClass}`}
                      >
                        <div className="relative aspect-[16/11] overflow-hidden">
                          <Image
                            src={item.imageSrc}
                            alt={`${item.name} by Zenvana — ${meta.label} stay in Dehradun`}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover transition duration-700 ease-editorial group-hover:scale-[1.04]"
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_30%,rgba(0,0,0,0.45)_100%)]" />
                          <span
                            className={`${meta.pillClass} absolute left-4 top-4 backdrop-blur`}
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
                          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                            {item.intent}
                          </p>
                        </div>
                      </Link>
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

/* ──────────────────────────────────────────────────────────────
 * STAY DIRECT PROMISE — productized
 * ────────────────────────────────────────────────────────────── */
function StayDirectSection() {
  const benefits = [
    {
      icon: ShieldCheck,
      title: 'Best public rate, guaranteed',
      text: 'Find the same dates cheaper on any OTA — we will match it and give you ₹500 toward your stay.',
    },
    {
      icon: Crown,
      title: 'Free upgrade window',
      text: 'On book-direct stays we open a 24-hour window before arrival to lift you a tier when rooms allow.',
    },
    {
      icon: Clock,
      title: 'Late check-out till 1 PM',
      text: 'Direct guests get an extra two hours at no charge. Easier mornings, lighter exits.',
    },
    {
      icon: Wallet,
      title: '₹500 wallet on every stay',
      text: 'Spend it on F&B, the next room, or the next stay — it follows you across the collection.',
    },
  ]

  return (
    <section className="section-rule">
      <div className="container-shell section-pad">
        <div className="overflow-hidden rounded-[2rem] bg-ink-gradient text-white">
          <div className="grid gap-0 lg:grid-cols-12">
            <div className="px-6 pt-10 sm:px-10 sm:pt-14 lg:col-span-5 lg:px-12 lg:pt-16">
              <span className="stay-direct-pill">
                <Sparkles className="h-3 w-3" />
                Stay direct
              </span>
              <h2 className="editorial-display mt-5 text-3xl leading-[0.96] sm:text-4xl lg:text-5xl">
                Book direct, and<br />
                <span className="gold-text">we make it worth it.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/80 sm:text-base">
                Four small promises that make the direct route quietly better than any
                travel-agent or OTA route. No fine print.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/hotels"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-300 px-5 py-3 text-sm font-medium text-ink-800 transition hover:bg-gold-200"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Book direct
                </Link>
                <Link
                  href="/stay-direct"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/14"
                >
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-px bg-white/10 sm:grid-cols-2 lg:col-span-7">
              {benefits.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="bg-ink-800/85 p-6 sm:p-7 lg:p-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-300/15 text-gold-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-200/90">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-white/80">
                        {text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
 * DINING — refined, restaurant-led entry to Feasta
 * ────────────────────────────────────────────────────────────── */
function DiningSection() {
  return (
    <section className="section-rule">
      <div className="container-shell section-pad">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="order-2 lg:order-1 lg:col-span-7">
            <div className="photo-card aspect-[16/10]">
              <Image
                src="/images/dehradun/feasta.png"
                alt="Feasta by Zenvana — rooftop restaurant on Rajpur Road, Dehradun"
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.18),transparent_60%),linear-gradient(to_bottom,_rgba(0,0,0,0.06),rgba(0,0,0,0.18))]" />
              <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/90 backdrop-blur">
                <UtensilsCrossed className="h-3.5 w-3.5" />
                Feasta · Rooftop restaurant
              </span>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-5">
            <div className="editorial-eyebrow">Dining</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              An evening in Dehradun, slowed down by a few floors of altitude.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Feasta is our rooftop restaurant on Rajpur Road. North Indian, continental,
              and Chinese — built around seasonal ingredients, calm music, and the kind
              of skyline you only get from this part of the foothills.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/restaurant" className="site-button-dark inline-flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Explore dining
              </Link>
              <Link href="/menu" className="site-button-light">
                See the full menu
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
 * WEDDINGS / EVENTS TEASER — single bold block → /weddings
 * ────────────────────────────────────────────────────────────── */
function WeddingsTeaserSection() {
  return (
    <section className="section-rule bg-card/40">
      <div className="container-shell section-pad">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <div className="editorial-eyebrow">Celebrations</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              The only Rajpur Road brand that can absorb a 150-room weekend.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Five hotels on the same stretch of road means weddings, corporate offsites,
              and private celebrations don&apos;t need to compromise on capacity. We can
              flex from an intimate 30-cover dinner to a 200-guest weekend across multiple
              properties.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/weddings"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-95"
              >
                <PartyPopper className="h-4 w-4" />
                Plan an event
              </Link>
              <Link href="/contact" className="site-button-light">
                Request a proposal
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="photo-card col-span-2 aspect-[16/9]">
                <Image
                  src="/images/dehradun/IMG_4477.JPG"
                  alt="Wedding setup at Zenvana Hotels in Dehradun"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="photo-card aspect-square">
                <Image
                  src="/images/dehradun/IMG_4478.JPG"
                  alt="Corporate event venue Dehradun"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="photo-card aspect-square">
                <Image
                  src="/images/dehradun/IMG_4505.jpg"
                  alt="Private celebration at Zenvana Dehradun"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
 * GALLERY
 * ────────────────────────────────────────────────────────────── */
function GallerySection() {
  const galleryImages = [
    '/images/dehradun/Rosewood.png',
    '/images/dehradun/silkwood .png',
    '/images/dehradun/MonteVerde.png',
    '/images/dehradun/Lucury room 1.png',
    '/images/dehradun/cherrwood building pic 1.png',
    '/images/dehradun/SILVER W BUILDING PIC.png',
    '/images/dehradun/feasta.png',
    '/images/dehradun/restaurantImage.png',
  ]

  return (
    <section className="section-rule">
      <div className="container-shell section-pad">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="editorial-eyebrow">Gallery</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              A visual feel for the stay.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Real interiors, real F&amp;B, real evenings. No stock library.
            </p>
          </div>
          <Link href="/hotels" className="site-button-light w-fit">
            View full gallery
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {galleryImages.map((src, idx) => (
            <div key={`${src}-${idx}`} className="photo-card aspect-[4/3]">
              <Image
                src={src}
                alt="Zenvana Hotels Dehradun · interior"
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition duration-500 ease-editorial hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.16),transparent_60%),linear-gradient(to_bottom,_rgba(0,0,0,0.06),rgba(0,0,0,0.1))]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* GuestVoicesSection: live + fallback in src/components/GuestVoicesSection.tsx */

/* ──────────────────────────────────────────────────────────────
 * PRESS / CERTIFICATIONS STRIP — text-based for now
 * ────────────────────────────────────────────────────────────── */
function PressTrustStrip() {
  const items = [
    'Listed on Adani One',
    'MakeMyTrip 4.0+',
    'Booking · Agoda · Expedia partner',
    'FSSAI registered',
    'Uttarakhand Tourism · Approved',
    'GST Compliant',
  ]
  // Duplicate so the marquee animation seams cleanly.
  const looped = [...items, ...items]

  return (
    <section className="border-y border-border/60 bg-card/30">
      <div className="overflow-hidden py-4 sm:py-5">
        <div className="trust-rail">
          {looped.map((label, i) => (
            <span
              key={`${label}-${i}`}
              className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground"
            >
              <BadgeCheck className="h-3.5 w-3.5 text-gold-400" />
              {label}
              <span className="mx-6 h-1 w-1 rounded-full bg-muted-foreground/30" />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
 * LOCATION
 * ────────────────────────────────────────────────────────────── */
function LocationSection({
  latitude,
  longitude,
  mapPlaceUrl,
}: {
  latitude?: number
  longitude?: number
  mapPlaceUrl?: string
}) {
  const highlights = [
    'Easy access to city cafés and local shopping',
    'A short drive toward foothill viewpoints and trails',
    'Good starting point for day trips and longer stays',
    'Mussoorie 35–45 mins · Jolly Grant Airport ~45 mins',
  ]

  return (
    <section className="section-rule">
      <div className="container-shell section-pad">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <div className="editorial-eyebrow">Location</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              Where the city meets the hills.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              A clear base for exploring nearby attractions while keeping the stay calm
              and connected.
            </p>

            <div className="mt-7 grid gap-3">
              {highlights.map((h) => (
                <div
                  key={h}
                  className="flex items-start gap-3 text-sm leading-7 text-muted-foreground sm:text-base"
                >
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-gold-400" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="photo-card aspect-[16/10]">
              <HomeLimewoodMap
                latitude={latitude}
                longitude={longitude}
                mapPlaceUrl={mapPlaceUrl}
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.22),transparent_58%),linear-gradient(to_bottom,_rgba(0,0,0,0.05),rgba(0,0,0,0.12))]" />

              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-2xl bg-background/80 px-3.5 py-2 text-sm text-foreground shadow-sm backdrop-blur">
                <MapPinned className="h-4 w-4" />
                Nearby highlights
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
 * FAQ
 * ────────────────────────────────────────────────────────────── */
function HomeFaqSection() {
  return (
    <section className="section-rule">
      <div className="container-shell section-pad">
        <div className="mx-auto max-w-3xl text-center">
          <div className="editorial-eyebrow">Useful to know</div>
          <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
            Quiet answers to common questions.
          </h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            Practical details about our hotels, location, dining, and direct booking —
            written for the way you actually plan a stay.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-3">
          {HOME_FAQS.map((faq) => (
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
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
 * BOOKING CTA
 * ────────────────────────────────────────────────────────────── */
function BookingCtaSection() {
  return (
    <section className="section-rule">
      <div className="container-shell section-pad">
        <div className="overflow-hidden rounded-[2rem] bg-signature-gradient px-6 py-12 text-white sm:px-8 sm:py-14 lg:px-10 lg:py-16">
          <div className="text-center">
            <div className="editorial-eyebrow text-white/70">Booking</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              A quieter stay starts with a clean booking.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base">
              Reserve direct for the best rate, easier coordination, and a smoother
              arrival.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/hotels"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-300 px-5 py-3 text-sm font-medium text-ink-800 transition hover:bg-gold-200"
              >
                <CalendarCheck className="h-4 w-4" />
                Book your stay
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/16"
              >
                <Phone className="h-4 w-4" />
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────
 * MOBILE STICKY BOOKING CTA
 * ────────────────────────────────────────────────────────────── */
function MobileBookingCta() {
  return (
    <div className="mobile-cta-bar lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-2">
        <a
          href="tel:+919084051774"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition hover:bg-muted"
          aria-label="Call Zenvana Hotels"
        >
          <Phone className="h-4.5 w-4.5" />
        </a>
        <Link
          href="/hotels"
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background transition hover:opacity-95"
        >
          <CalendarCheck className="h-4 w-4" />
          Check availability
        </Link>
      </div>
    </div>
  )
}
