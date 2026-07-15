import Link from 'next/link'
import CloudinaryImage from '@/components/CloudinaryImage'
import { Reveal } from '@/components/motion/Reveal'
import {
  ArrowRight,
  BadgeCheck,
  Car,
  Clock,
  Gem,
  MapPin,
  Mountain,
  Sparkles,
  TrainFront,
  Wallet,
} from 'lucide-react'

import { getPublicPropertiesListing, getPublicPropertyBySlug } from '@/lib/api'
import { Container } from '@/components/Container'
import { PriceWithTax } from '@/components/PriceWithTax'
import { Card, CardContent } from '@/components/ui/Card'
import { addDaysYmd, kolkataYmd } from '@/lib/kolkata-calendar'
import { pickHeroAndGallery } from '@/lib/media'
import { JsonLd } from '@/components/JsonLd'
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  itemListJsonLd,
} from '@/lib/structured-data'
import { DAY_USE_STAY_KIND_PARAM } from '@/lib/stay-kind'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

export const revalidate = 3600

export const metadata = {
  title: 'Hourly Hotel Rooms in Dehradun · Zenvana Hourly Stays',
  description:
    'Book a boutique hotel room in Dehradun for a few hours — 3, 6, or 9 hour stays on Rajpur Road. Change before a wedding, rest during a train layover, or take a halt before Mussoorie. Book direct.',
  keywords: [
    'hourly hotel Dehradun',
    'hourly stay Dehradun',
    'hotel for few hours Dehradun',
    'day room Dehradun',
    'short stay hotel Rajpur Road',
    'hourly rooms near Dehradun railway station',
  ],
  alternates: { canonical: '/hourly-stays' },
  openGraph: {
    title: 'Hourly Hotel Rooms in Dehradun · Zenvana Hourly Stays',
    description:
      'Boutique rooms by the hour in Dehradun — 3h, 6h, and 9h stays. Book direct with Zenvana.',
    url: `${SITE_URL}/hourly-stays`,
    type: 'website',
  },
}

/**
 * Same "starting from" maths the backend quote uses, applied to the listing
 * night price: max(floor, night × basePercent × hours/baseDuration). Shown as
 * an approximate from-price; the exact quote is confirmed in the booking flow.
 */
function estimateHourlyFromPrice(
  nightAmount: number,
  hourlyStay: {
    basePercentOfNight?: number
    baseDurationHours?: number
    floorPrice?: number
  },
  hours: number,
): number {
  const percent = hourlyStay.basePercentOfNight ?? 0.25
  const baseHours = hourlyStay.baseDurationHours ?? 3
  const floor = hourlyStay.floorPrice ?? 0
  return Math.round(
    Math.max(floor, nightAmount * percent * (hours / baseHours)),
  )
}

const useCases = [
  {
    icon: Gem,
    title: 'Shaadi ke liye change',
    text: 'Function se pehle taiyaar hone ke liye ek private room — outfit change, shower, touch-up. Poori raat book karne ki zaroorat nahi.',
  },
  {
    icon: TrainFront,
    title: 'Train ya flight ka layover',
    text: 'Dehradun pahunch gaye, aage ka safar shaam ko hai? Beech ke ghanton mein saaf kamre mein aaram kijiye.',
  },
  {
    icon: Mountain,
    title: 'Mussoorie se pehle halt',
    text: 'Pahaad chadhne se pehle fresh ho lijiye — shower, thodi neend, phir taze hokar nikal padiye.',
  },
  {
    icon: Car,
    title: 'Road trip ka break',
    text: 'Lambi drive ke beech 3 ghante ka shaant kamra — Delhi–Doon highway ke bilkul paas, Rajpur Road par.',
  },
  {
    icon: Clock,
    title: 'Early check-in ka intezaar',
    text: 'Kahin aur booking hai par kamra abhi ready nahi? Beech ka waqt aaram se guzariye.',
  },
  {
    icon: Sparkles,
    title: 'Aur bhi bahut kuch',
    text: 'Din bhar ke kaam ke beech ek quiet base, interview se pehle taiyaari, ya bas thodi der ka sukoon.',
  },
]

const howItWorks = [
  {
    icon: Clock,
    title: 'Slot chuniye',
    text: '3, 6, ya 9 ghante — subah 10:00 se raat 21:00 ke beech.',
  },
  {
    icon: BadgeCheck,
    title: 'Direct confirm',
    text: 'Booking seedha hotel ke saath hoti hai — reference turant milta hai.',
  },
  {
    icon: Wallet,
    title: 'Payment aapki marzi',
    text: 'Online pay kijiye ya hotel pahunch kar — dono chalta hai.',
  },
]

export default async function HourlyStaysPage() {
  const checkInYmd = kolkataYmd()
  const checkOutYmd = addDaysYmd(checkInYmd, 1)

  const snapshot = await getPublicPropertiesListing(checkInYmd, checkOutYmd, 1)
  const allProperties = snapshot?.properties ?? []
  const listingPriceBySlug = snapshot?.listingPriceBySlug ?? {}

  const hourlyProperties = allProperties.filter(
    (p) => p.hourlyStayEnabled && p.hourlyStay?.enabled,
  )

  const fullDetails = await Promise.all(
    hourlyProperties.map((p) =>
      p.heroImageUrl ? Promise.resolve(null) : getPublicPropertyBySlug(p.slug),
    ),
  )

  const propertiesForGrid = hourlyProperties
    .map((p, i) => {
      const heroImageUrl =
        p.heroImageUrl ?? pickHeroAndGallery(fullDetails[i]?.images).heroUrl
      const line = listingPriceBySlug[p.slug]
      const nightAmount =
        line && typeof line === 'object' && line.totalAmount > 0
          ? line.totalAmount
          : null
      const from3h =
        nightAmount != null && p.hourlyStay
          ? estimateHourlyFromPrice(nightAmount, p.hourlyStay, 3)
          : null
      const durations = p.hourlyStay?.durationsHours?.length
        ? p.hourlyStay.durationsHours
        : [3, 6, 9]
      return { ...p, heroImageUrl, from3h, durations }
    })
    .sort((a, b) => {
      const pa = a.from3h ?? Infinity
      const pb = b.from3h ?? Infinity
      if (pa !== pb) return pa - pb
      return a.publicName.localeCompare(b.publicName)
    })

  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Hourly stays', url: `${SITE_URL}/hourly-stays` },
  ]

  const itemListData = itemListJsonLd({
    name: 'Zenvana Hourly Stays — Dehradun',
    url: `${SITE_URL}/hourly-stays`,
    items: propertiesForGrid.map((p) => ({
      name: p.publicName,
      url: `${SITE_URL}/hotels/${p.slug}`,
      image: p.heroImageUrl,
    })),
  })

  const priced = propertiesForGrid.filter((p) => p.from3h != null)
  const minFrom3h = priced.length
    ? Math.min(...priced.map((p) => p.from3h as number))
    : null
  const hotelNames = propertiesForGrid.map((p) => p.publicName)
  const hotelNamesLine =
    hotelNames.length > 1
      ? `${hotelNames.slice(0, -1).join(', ')} and ${
          hotelNames[hotelNames.length - 1]
        }`
      : hotelNames[0] ?? 'select Zenvana hotels'

  // Rendered verbatim in the FAQ section below AND emitted as FAQPage schema.
  const faqs = [
    {
      question: 'Can I book a hotel room for just a few hours in Dehradun?',
      answer:
        'Yes. Zenvana boutique hotels on Rajpur Road, Dehradun offer hourly stays in 3, 6, and 9-hour slots, bookable between 10:00 and 21:00. You get the same room, housekeeping, and comfort as an overnight guest — for exactly the hours you need.',
    },
    {
      question: 'How much does an hourly hotel room cost in Dehradun?',
      answer:
        minFrom3h != null
          ? `A 3-hour stay starts from around ₹${minFrom3h.toLocaleString(
              'en-IN',
            )} plus GST, depending on the hotel and date. Longer 6 and 9-hour slots cost proportionally more, and the exact price for your slot is always shown before you confirm.`
          : 'Pricing depends on the hotel and date — the exact price for your slot is always shown before you confirm, and a 3-hour stay costs a fraction of the overnight rate.',
    },
    {
      question: 'Which Zenvana hotels offer hourly stays?',
      answer: `${hotelNamesLine} currently offer hourly stays — all on Rajpur Road, Dehradun. Availability for your exact slot is checked live when you book.`,
    },
    {
      question: 'What is an hourly hotel stay useful for?',
      answer:
        'Changing and freshening up before a wedding or function, resting during a train or flight layover, taking a halt before driving up to Mussoorie, breaking a long road trip, or waiting out an early arrival before check-in elsewhere.',
    },
    {
      question: 'How do I pay for an hourly stay?',
      answer:
        'Pay online while booking or at the hotel when you arrive — both work. The booking is made directly with the property and your reference is issued instantly.',
    },
    {
      question: 'Do I need to book a full night if I arrive early in Dehradun?',
      answer:
        'No. If you reach Dehradun early morning by train or bus and your plans start later in the day, a 3 or 6-hour slot covers the wait — shower, rest, and leave refreshed without paying for a full night.',
    },
  ]

  return (
    <main className="page-enter bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd data={itemListData} />
      <JsonLd data={faqPageJsonLd(faqs)} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,230,76,0.08),transparent_26%),radial-gradient(circle_at_80%_15%,rgba(116,195,101,0.06),transparent_24%)]" />
        <Container className="relative py-14 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground backdrop-blur-sm">
              <Clock className="h-3.5 w-3.5" />
              Zenvana · Hourly stays
            </div>

            <h1 className="mt-5 font-serif text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.98] tracking-[-0.045em] text-foreground">
              Kuch ghanton ke liye,
              <span className="block">poori tarah aapka.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              Boutique hotel rooms in Dehradun by the hour — jab kaam kuch hi
              ghanton ka ho, toh kamra bhi utne hi ghanton ka. 3, 6, ya 9 ghante
              ke slots, wahi Zenvana comfort, bina full-night price ke.
            </p>
          </div>
        </Container>
      </section>

      {/* Use cases — the honest reasons people need a room for a few hours */}
      <section className="border-b border-border/60">
        <Container className="py-12 sm:py-16">
          <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Kab kaam aata hai
          </div>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="rounded-[1.5rem] border border-border/60 bg-card/50 p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/70 text-gold-500">
                  <Icon className="h-4.5 w-4.5" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-base font-medium text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* How it works */}
      <section className="border-b border-border/60 bg-muted/25">
        <Container className="py-10 sm:py-12">
          <ol className="grid gap-6 sm:grid-cols-3">
            {howItWorks.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <Icon className="h-4.5 w-4.5" aria-hidden />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    Step {i + 1}
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Properties grid */}
      <section>
        <Container className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              The collection
            </div>
            <h2 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.04em] text-foreground sm:text-4xl">
              Hourly stays available at these hotels
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              “From” prices below are for a 3-hour stay today, before GST — the
              exact price for your slot is confirmed at booking. Sabhi hotels
              Rajpur Road, Dehradun par.
            </p>
          </div>

          {propertiesForGrid.length === 0 ? (
            <div className="mt-12 rounded-[2rem] border border-border/60 bg-card/50 p-8 text-center">
              <p className="text-sm leading-7 text-muted-foreground">
                Hourly stays are briefly unavailable — please check back soon,
                or{' '}
                <Link
                  href="/hotels"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  browse overnight stays
                </Link>
                .
              </p>
            </div>
          ) : (
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {propertiesForGrid.map((p, index) => (
                <li key={p.slug} className="h-full">
                  <Reveal delay={index * 60} className="h-full">
                    <Link
                      href={`/book/${p.slug}?stayKind=${DAY_USE_STAY_KIND_PARAM}`}
                      className="group block h-full"
                    >
                      <Card className="h-full overflow-hidden rounded-[2rem] border-border/60 bg-card/70 text-card-foreground shadow-[0_18px_45px_rgba(8,17,31,0.05)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_26px_80px_rgba(8,17,31,0.1)] dark:bg-card/50">
                        {p.from3h != null ? (
                          <div className="flex flex-col gap-2 border-b border-border/60 bg-muted/35 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6">
                            <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                              From · 3 hours (direct)
                            </span>
                            <PriceWithTax amount={p.from3h} size="default" />
                          </div>
                        ) : null}

                        <div className="relative overflow-hidden">
                          {p.heroImageUrl ? (
                            <CloudinaryImage
                              src={p.heroImageUrl}
                              alt={`${p.publicName} — hourly stay in Dehradun`}
                              width={1200}
                              height={800}
                              className="h-[280px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="flex h-[280px] w-full items-center justify-center bg-muted">
                              <Mountain className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}

                          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,31,0.03)_0%,rgba(8,17,31,0.14)_42%,rgba(8,17,31,0.78)_100%)]" />

                          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur-md">
                              <Clock className="h-3 w-3 shrink-0" aria-hidden />
                              {p.durations.map((h) => `${h}h`).join(' · ')}{' '}
                              slots
                            </div>
                          </div>
                        </div>

                        <CardContent className="p-6 sm:p-7">
                          <h3 className="font-serif text-2xl leading-tight tracking-[-0.03em] text-foreground transition-colors group-hover:text-primary">
                            {p.publicName}
                          </h3>

                          {(p.city || p.state) && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 shrink-0" />
                              <span>
                                {[p.city, p.state].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}

                          <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-5">
                            <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                              Book by the hour
                            </span>
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-transform duration-300 group-hover:translate-x-1">
                              Check slots
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-10 text-center text-xs leading-6 text-muted-foreground">
            Overnight rukna hai?{' '}
            <Link
              href="/hotels"
              className="font-medium text-foreground/80 underline-offset-4 transition hover:text-foreground hover:underline"
            >
              Explore all hotels
            </Link>
          </p>
        </Container>
      </section>

      {/* Location intent — indexable orientation copy for transit searches */}
      <section className="border-t border-border/60 bg-muted/25">
        <Container className="py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                Well placed for a halt
              </div>
              <h2 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.04em] text-foreground sm:text-4xl">
                Hourly hotel rooms on Rajpur Road, Dehradun
              </h2>
              <p className="mt-5 text-sm leading-[1.85] text-muted-foreground sm:text-[15px]">
                Every Zenvana hotel offering hourly stays sits on or just off
                Rajpur Road — about 20–25 minutes from Dehradun railway station
                and ISBT, roughly 45 minutes from Jolly Grant Airport, and
                directly on the route up to{' '}
                <Link
                  href="/mussoorie"
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  Mussoorie
                </Link>
                . If your train reaches at dawn, your flight leaves at night, or
                the hills can wait a few hours — you are minutes away from a
                quiet room, a hot shower, and a proper rest.
              </p>
              <p className="mt-4 text-sm leading-[1.85] text-muted-foreground sm:text-[15px]">
                Book a 3, 6, or 9-hour slot between 10:00 and 21:00, directly
                with the hotel — no third-party markups, and the same boutique
                rooms we sell{' '}
                <Link
                  href="/hotels"
                  className="underline-offset-4 hover:text-foreground hover:underline"
                >
                  overnight
                </Link>
                .
              </p>
            </div>

            {/* FAQ — rendered text mirrors the FAQPage schema exactly */}
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                Hourly stays, answered
              </div>
              <div className="mt-4">
                {faqs.map((faq, index) => (
                  <details
                    key={faq.question}
                    className="group border-b border-border py-4 transition"
                  >
                    <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 text-left">
                      <div className="flex items-baseline gap-4">
                        <span className="font-serif text-base font-light text-muted-foreground">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="font-serif text-lg font-light leading-snug tracking-[-0.01em] text-foreground">
                          {faq.question}
                        </span>
                      </div>
                      <span className="mt-1 shrink-0 text-base text-muted-foreground transition group-open:rotate-45 group-open:text-foreground">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 max-w-2xl pl-9 text-[14.5px] leading-[1.85] text-muted-foreground">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  )
}
