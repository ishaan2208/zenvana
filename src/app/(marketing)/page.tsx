import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarCheck,
  ChevronDown,
  Clock,
  Crown,
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
import type { PublicPropertyListItem } from '@/lib/api'
import {
  getPublicBookingsCount,
  getPublicProperties,
  getPublicPropertyBySlug,
} from '@/lib/api'
import { HeroBookBarDeferred } from './HeroBookBarDeferred'
import { MobileBookingDrawer } from './MobileBookingDrawer'
import type { HeroBookBarProperty } from './HeroBookBar'
import { PropertyPyramidSection } from './PropertyPyramidSection'
import { JsonLd } from '@/components/JsonLd'
import { TrustStripSection } from './TrustStripSection'
import { GuestVoicesSection } from '@/components/GuestVoicesSection'
import { DeferredLocationMap } from '../../components/DeferredLocationMap'
import {
  breadcrumbJsonLd,
  collectionLodgingJsonLd,
  faqPageJsonLd,
  hotelGroupJsonLd,
} from '@/lib/structured-data'
import { GoogleAdsHomeConversion } from '@/components/GoogleAdsTag'
import { HeroVideo } from '@/components/HeroVideo'
import { BlogStoryThumbnail } from '@/components/blog/BlogStoryThumbnail'
import { getBlogPostHref, getPublishedBlogPosts } from '@/lib/blog'
import { deriveBlogCategory } from '@/lib/blogContent'
import {
  estimateReadingTimeMinutes,
  formatPublishedDate,
} from '@/lib/blogReadingTime'

function GuestVoicesSectionFallback() {
  return (
    <section className="section-rule bg-background" aria-busy="true">
      <div className="container-shell section-pad">
        <div className="h-48 animate-pulse rounded-2xl bg-muted/60 sm:h-56" />
      </div>
    </section>
  )
}

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
      'Zenvana operates a small collection of boutique hotels — Rosewood, Silkwood, Monte Verde, Silverwood, Cherrywood, Limewood, and Serenewood — each with its own character and price point, all on or near Rajpur Road.',
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

const TRUST_OWNER_USER_ID = 1
const BOOKINGS_ENDPOINT = `/api/public/bookings-count?userId=${TRUST_OWNER_USER_ID}`

export default async function HomePage() {
  const properties = await getPublicProperties()
  const limewood = await getPublicPropertyBySlug('limewood')
  const initialBookingsCount = await getPublicBookingsCount(TRUST_OWNER_USER_ID)
  const heroProperties = properties.map((p) => ({
    slug: p.slug,
    publicName: p.publicName,
    heroImageUrl: p.heroImageUrl,
    fullAddress: p.fullAddress,
    hourlyStayEnabled: p.hourlyStayEnabled,
    hourlyStay: p.hourlyStay,
  }))
  const groupProperties = properties.map((p) => ({
    slug: p.slug,
    publicName: p.publicName,
    heroImageUrl: p.heroImageUrl ?? undefined,
  }))

  return (
    <>
      <GoogleAdsHomeConversion />
      <div className="mobile-cta-pad">
      <JsonLd
        data={[
          hotelGroupJsonLd(groupProperties),
          ...collectionLodgingJsonLd(groupProperties),
          faqPageJsonLd(HOME_FAQS),
          breadcrumbJsonLd([{ name: 'Home', url: SITE_URL }]),
        ]}
      />

      <HeroSection properties={heroProperties} />
      <TrustStripSection
        initialBookingsCount={initialBookingsCount}
        bookingsEndpoint={BOOKINGS_ENDPOINT}
        propertyCount={properties.length}
      />
      <WhyZenvanaSection />
      <PropertyPyramidSection properties={properties} />
      <StayDirectSection />
      <DiningSection />
      <WeddingsTeaserSection />
      <Suspense fallback={<GuestVoicesSectionFallback />}>
        <GuestVoicesSection />
      </Suspense>
      <PressTrustStrip />
      <LocationSection
        latitude={limewood?.latitude}
        longitude={limewood?.longitude}
        mapPlaceUrl={limewood?.googleMapPlaceUrl}
      />
      <Suspense fallback={<JournalSectionFallback />}>
        <JournalSection />
      </Suspense>
      <HomeFaqSection />
      <BookingCtaSection />

      <MobileBookingCta properties={heroProperties} />
    </div>
    </>
  )
}

/* ──────────────────────────────────────────────────────────────
 * HERO
 * ────────────────────────────────────────────────────────────── */
function HeroSection({
  properties,
}: {
  properties: {
    slug: string
    publicName: string
    heroImageUrl?: string
    fullAddress?: string
  }[]
}) {
  return (
    <section className="relative min-h-[92svh] overflow-hidden">
      <div className="absolute inset-0">
        <HeroVideo />
        <div className="absolute inset-0 bg-hero-shade" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_60%),repeating-linear-gradient(135deg,_rgba(255,255,255,0.06),_rgba(255,255,255,0.06)_1px,_transparent_1px,_transparent_10px)]" />
        </div>
      </div>

      <div className="container-shell relative flex min-h-[92svh] flex-col items-center justify-end pb-10 pt-32 sm:items-center sm:justify-center sm:pb-12 lg:pb-24">
        <div className="relative z-10 mx-auto max-w-4xl text-center text-white animate-fade-up">
          <div className="space-y-4 sm:space-y-6 lg:space-y-7">
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
          <HeroBookBarDeferred properties={properties} />
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
            A small collection on Rajpur Road
          </h2>
          <p className="sr-only">
            Best hotel in Dehradun — Zenvana Hotels boutique stays near Mussoorie.
          </p>
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
              Today we run seven properties on or around{' '}
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
    <section className="section-rule p-4">
      <div className="container-shell section-pad">
        <div className="overflow-hidden rounded-[2rem] bg-ink-gradient text-white">
          <div className="grid gap-0 lg:grid-cols-12 lg:items-stretch">
            <div className="border-b border-white/10 px-5 py-10 sm:px-8 sm:py-12 lg:col-span-5 lg:flex lg:flex-col lg:justify-center lg:border-b-0 lg:px-10 lg:py-16 xl:px-12">
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

            <div className="grid min-h-0 grid-cols-1 gap-px bg-white/10 sm:grid-cols-2 lg:col-span-7 lg:self-stretch">
              {benefits.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="bg-ink-800/85 p-6 sm:p-7 lg:flex lg:items-center lg:p-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-300/15 text-gold-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold leading-snug text-gold-200">
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
                quality={65}
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
            <h2 className="editorial-display text-3xl sm:text-4xl lg:text-5xl">
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
            <h2 className="editorial-display text-3xl sm:text-4xl lg:text-5xl">
              The only Rajpur Road brand that can absorb a 150-room weekend.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Seven hotels on the same stretch of road means weddings, corporate offsites,
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
                  quality={65}
                  className="object-cover"
                />
              </div>
              <div className="photo-card aspect-square">
                <Image
                  src="/images/dehradun/IMG_4478.JPG"
                  alt="Corporate event venue Dehradun"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  quality={60}
                  className="object-cover"
                />
              </div>
              <div className="photo-card aspect-square">
                <Image
                  src="/images/dehradun/IMG_4505.jpg"
                  alt="Private celebration at Zenvana Dehradun"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  quality={60}
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
            <h2 className="editorial-display text-3xl sm:text-4xl lg:text-5xl">
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
              <DeferredLocationMap
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
 * FROM THE JOURNAL — latest posts (topical authority + internal links)
 * ────────────────────────────────────────────────────────────── */
function JournalCard({
  post,
}: {
  post: Awaited<ReturnType<typeof getPublishedBlogPosts>>[number]
}) {
  const href = getBlogPostHref(post)
  const category = deriveBlogCategory(post)
  const readTime = estimateReadingTimeMinutes(post.contentHtml)
  const date = post.publishedAt ? formatPublishedDate(post.publishedAt) : null

  return (
    <article className="group flex min-w-0 flex-col">
      <BlogStoryThumbnail
        post={post}
        href={href}
        aspect="3/2"
        sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
      />
      <div className="mt-5 flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          <span className="text-gold-600 dark:text-gold-300">{category}</span>
          <span aria-hidden="true">·</span>
          <span>{readTime} min read</span>
          {date ? (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={post.publishedAt!.toISOString()}>{date}</time>
            </>
          ) : null}
        </div>
        <Link href={href}>
          <h3 className="editorial-display text-xl leading-[1.2] text-foreground transition group-hover:opacity-80 sm:text-2xl">
            {post.title}
          </h3>
        </Link>
        <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
      </div>
    </article>
  )
}

async function JournalSection() {
  const posts = await getPublishedBlogPosts().catch(() => [])
  const latest = posts.slice(0, 3)

  return (
    <section className="section-rule bg-card/30">
      <div className="container-shell section-pad">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="editorial-eyebrow">From the Journal</div>
            <h2 className="editorial-display mt-3 text-3xl font-semibold sm:text-4xl lg:text-5xl">
              Notes from Rajpur Road.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Slow guides to staying in Dehradun, the Mussoorie foothills, and the everyday
              rituals that make the city worth lingering in — written by the team that runs
              our hotels.
            </p>
          </div>
          <Link href="/blog" className="site-button-light w-fit md:mt-2">
            Read the Journal
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {latest.length > 0 ? (
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-x-6 lg:gap-x-10">
            {latest.map((post) => (
              <JournalCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-[1.75rem] border border-border/60 bg-background/60 px-6 py-14 text-center sm:py-16">
            <BookOpen className="mx-auto h-6 w-6 text-gold-400" />
            <h3 className="editorial-display mt-4 text-2xl text-foreground">
              The Journal is being written.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
              Our first stories about Rajpur Road, the foothills, and slow stays in Dehradun
              are on the way.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function JournalSectionFallback() {
  return (
    <section className="section-rule bg-card/30" aria-busy="true">
      <div className="container-shell section-pad">
        <div className="h-9 w-56 animate-pulse rounded-full bg-muted/60" />
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-x-6 lg:gap-x-10">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-4">
              <div className="aspect-[3/2] animate-pulse rounded-[1.5rem] bg-muted/60" />
              <div className="h-3 w-24 animate-pulse rounded-full bg-muted/60" />
              <div className="h-5 w-full animate-pulse rounded-full bg-muted/60" />
              <div className="h-16 w-full animate-pulse rounded-2xl bg-muted/40" />
            </div>
          ))}
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
          <h2 className="editorial-display text-3xl sm:text-4xl lg:text-5xl">
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
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium tracking-tight text-foreground sm:text-lg [&::-webkit-details-marker]:hidden">
                <span>{faq.question}</span>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-foreground transition group-open:rotate-180"
                  aria-hidden
                >
                  <ChevronDown className="h-4 w-4" />
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
            <h2 className="editorial-display text-3xl sm:text-4xl lg:text-5xl">
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
function MobileBookingCta({ properties }: { properties: HeroBookBarProperty[] }) {
  return (
    <div className="mobile-cta-bar lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-2">
        <a
          href="tel:9084051774"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition hover:bg-muted"
          aria-label="Call Zenvana Hotels"
        >
          <Phone className="h-4.5 w-4.5" />
        </a>
        <a
          href="https://wa.me/919084051774"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:bg-[#20c45a]"
          aria-label="WhatsApp Zenvana Hotels"
        >
          <WhatsAppIcon className="h-5 w-5" />
        </a>
        <MobileBookingDrawer properties={properties} />
      </div>
    </div>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.03 2C6.62 2 2.2 6.4 2.2 11.83c0 1.74.45 3.43 1.31 4.93L2 22l5.39-1.42a9.85 9.85 0 0 0 4.64 1.18h.01c5.41 0 9.83-4.4 9.83-9.83A9.77 9.77 0 0 0 19.05 4.9Zm-7.02 15.2h-.01a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.2.84.85-3.12-.2-.32a8.08 8.08 0 0 1-1.25-4.36c0-4.46 3.63-8.09 8.1-8.09 2.16 0 4.18.84 5.7 2.36a7.99 7.99 0 0 1 2.37 5.73c0 4.47-3.63 8.1-8.09 8.1Zm4.44-6.06c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.18-.71-.63-1.19-1.4-1.33-1.64-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.42-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.31.98 2.47c.12.16 1.68 2.56 4.08 3.6.57.24 1.01.38 1.36.49.57.18 1.08.16 1.48.1.45-.06 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  )
}
