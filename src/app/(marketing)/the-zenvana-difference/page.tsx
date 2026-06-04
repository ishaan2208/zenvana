import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Cog,
  Compass,
  Crown,
  Gem,
  Handshake,
  HeartHandshake,
  Hotel,
  Leaf,
  LineChart,
  Phone,
  Quote,
  Sparkles,
  Wrench,
} from 'lucide-react'

import { Container } from '@/components/Container'
import { JsonLd } from '@/components/JsonLd'
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/structured-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'The Zenvana Difference · Owner-operated boutique stays in Dehradun',
  description:
    'How a small, owner-operated boutique collection on Rajpur Road runs differently — from a tiered brand pyramid to in-house technology and direct-booking economics that put value back into your stay.',
  keywords: [
    'owner-operated hotel Dehradun',
    'best boutique hotel Dehradun',
    'Zenvana brand pyramid',
    'hotel technology Dehradun',
    'why book Zenvana',
    'family-run hotels Dehradun',
  ],
  alternates: { canonical: '/the-zenvana-difference' },
  openGraph: {
    title: 'The Zenvana Difference',
    description:
      'How a small, owner-operated boutique collection on Rajpur Road runs differently.',
    url: `${SITE_URL}/the-zenvana-difference`,
    type: 'article',
  },
}

export default function ZenvanaDifferencePage() {
  const url = `${SITE_URL}/the-zenvana-difference`
  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'The Zenvana Difference', url },
  ]
  const article = articleJsonLd({
    title: 'The Zenvana Difference',
    description:
      'How a small, owner-operated boutique collection on Rajpur Road runs differently — brand pyramid, technology stack, and direct-booking economics.',
    url,
    image: `${SITE_URL}/images/dehradun/MonteVerde.png`,
    section: 'About Zenvana',
  })

  return (
    <main className="mobile-cta-pad bg-background text-foreground">
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), article]} />

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink-gradient text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-soft-light">
          <div className="h-full w-full bg-[radial-gradient(circle_at_20%_30%,_rgba(200,168,90,0.4),transparent_45%),radial-gradient(circle_at_80%_70%,_rgba(30,72,143,0.4),transparent_45%)]" />
        </div>
        <Container className="relative py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <span className="stay-direct-pill">
              <Sparkles className="h-3 w-3" />
              The Zenvana difference
            </span>
            <h1 className="editorial-display mt-6 text-4xl font-semibold leading-[0.94] sm:text-5xl lg:text-7xl">
              Seven hotels.<br />
              <span className="gold-text">One operator.</span><br />
              The same hands on the road.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/82 sm:text-lg sm:leading-8">
              Most boutique hotels in Tier-2 India are franchised, leased, or
              part-corporate. Zenvana isn&apos;t. The same person who designs the room
              also signs off on the menu, the photography, the booking engine, and
              tomorrow&apos;s pricing. That changes what is possible inside a stay — quietly,
              but completely.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/hotels"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-300 px-5 py-3 text-sm font-medium text-ink-800 transition hover:bg-gold-200"
              >
                <CalendarCheck className="h-4 w-4" />
                Browse the collection
              </Link>
              <Link
                href="#pyramid"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/14"
              >
                See how the brand pyramid works
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* OPENING NUMBERS */}
      <section className="border-y border-border/60 bg-card/40">
        <Container className="py-8 sm:py-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              { headline: '7', sub: 'Properties on Rajpur Road' },
              { headline: '150', sub: 'Rooms across the cluster' },
              { headline: '1', sub: 'Owner-operator. No franchise layer.' },
              { headline: '0', sub: 'OTA commission on direct bookings' },
            ].map((s) => (
              <div
                key={s.sub}
                className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-center sm:px-5 sm:py-4"
              >
                <div className="font-serif text-2xl tracking-[-0.02em] text-foreground sm:text-3xl">
                  {s.headline}
                </div>
                <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* OWNER-OPERATOR NARRATIVE */}
      <section className="section-rule">
        <Container className="section-pad-lg">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <div className="editorial-eyebrow">Owner-operated</div>
              <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
                The shortest line in hospitality is between intent and execution.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                A franchised hotel takes a guest issue, routes it to a regional manager,
                who escalates it to a brand standards team, who replies in three working
                days. By then the guest has checked out and left a review.
              </p>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                At Zenvana, the same person who built the booking flow walks the floor at
                7 AM. The breakfast plate, the welcome drink, the music in the lobby, the
                way the housekeeping team folds towels — all decisions made by a small
                team that has stayed in their own rooms enough nights to know what bothers
                a guest at 2 AM.
              </p>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                It is the simplest thing. It is also the rarest. Most boutique hotels in
                Dehradun are not run this way.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="photo-card col-span-2 aspect-[16/10]">
                  <Image
                    src="/images/dehradun/Reception (1).png"
                    alt="Zenvana Hotels reception in Dehradun"
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                </div>
                <div className="photo-card aspect-square">
                  <Image
                    src="/images/dehradun/Reception Desk (2).png"
                    alt="Reception desk at Zenvana"
                    fill
                    sizes="(max-width: 768px) 50vw, 30vw"
                    className="object-cover"
                  />
                </div>
                <div className="photo-card aspect-square">
                  <Image
                    src="/images/dehradun/Lift (1).png"
                    alt="Zenvana hotel interior corridor"
                    fill
                    sizes="(max-width: 768px) 50vw, 30vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* PULL QUOTE */}
      <section className="section-rule bg-card/30">
        <Container className="py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Quote className="mx-auto h-8 w-8 text-gold-400" />
            <blockquote className="editorial-display mt-6 text-2xl leading-[1.2] text-foreground sm:text-3xl lg:text-4xl">
              &ldquo;A hotel is a daily product, not a one-time launch. Every morning the
              kitchen reopens, the housekeeping cycle restarts, and a new guest decides
              within five minutes whether to trust us. We chose to operate ourselves so
              that decision lands on people who actually care about it.&rdquo;
            </blockquote>
            <div className="mt-6 text-sm uppercase tracking-[0.28em] text-muted-foreground">
              — The Zenvana team
            </div>
          </div>
        </Container>
      </section>

      {/* BRAND PYRAMID */}
      <section id="pyramid" className="section-rule scroll-mt-24">
        <Container className="section-pad-lg">
          <div className="max-w-3xl">
            <div className="editorial-eyebrow">The brand pyramid</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              Three tiers. One promise. Pick the room that fits the trip.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              Most hotel chains stretch one brand thin across every price point. We
              decided to do the opposite — and let each tier set its own standard while
              the operating team and service ethic stay constant.
            </p>
          </div>

          <div className="mt-12 space-y-5 sm:space-y-6">
            {[
              {
                tier: 'Essential',
                pillClass: 'tier-pill tier-pill-essential',
                icon: Leaf,
                names: ['Rosewood'],
                headline: 'Considered value, built around the basics done right.',
                body:
                  'A clean entry point — proportions designed around the bed, the morning, and the road back into the city. The honest version of a value-led stay, without anything that feels franchised.',
                bullets: ['Compact, light-led rooms', 'Same hospitality standard as our higher tiers', 'The most popular pick for short, practical trips'],
              },
              {
                tier: 'Refined',
                pillClass: 'tier-pill tier-pill-refined',
                icon: Gem,
                names: ['Silkwood', 'Cherrywood'],
                headline: 'A few quiet steps up — softer materials, more space, calmer evenings.',
                body:
                  'Rooms that feel a little more considered: better mattresses, a softer light, and the kind of layout that suits longer stays. The tier most repeat guests gravitate toward.',
                bullets: ['Larger, softer rooms', 'Higher floors and city views', 'Built for slower, longer evenings'],
              },
              {
                tier: 'Signature',
                pillClass: 'tier-pill tier-pill-signature',
                icon: Crown,
                names: ['Monte Verde', 'Silverwood'],
                headline: 'Our most considered, slow-paced stays.',
                body:
                  'Generous proportions, soft lighting, and a rhythm built for unhurried days. The signature tier is where we put our most editorial energy — the rooms we would book for ourselves.',
                bullets: ['Spacious rooms with framed views', 'Editorial-grade interior design', 'Signature welcome and turndown rituals'],
              },
            ].map((t) => {
              const Icon = t.icon
              return (
                <article
                  key={t.tier}
                  className="grid items-start gap-6 rounded-[1.75rem] border border-border/60 bg-card/70 p-6 sm:p-8 lg:grid-cols-[1fr_2fr] lg:gap-10"
                >
                  <div>
                    <span className={t.pillClass}>
                      <Icon className="h-3 w-3" />
                      {t.tier}
                    </span>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {t.names.map((n) => (
                        <span
                          key={n}
                          className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/80"
                        >
                          <Hotel className="h-3 w-3" />
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl leading-[1.1] tracking-[-0.02em] text-foreground sm:text-3xl">
                      {t.headline}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                      {t.body}
                    </p>
                    <ul className="mt-5 grid gap-2 sm:grid-cols-3">
                      {t.bullets.map((b) => (
                        <li
                          key={b}
                          className="rounded-[1rem] border border-border/60 bg-background/70 px-3 py-2.5 text-xs leading-6 text-muted-foreground sm:text-sm"
                        >
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-95"
            >
              <CalendarCheck className="h-4 w-4" />
              Compare all properties
            </Link>
          </div>
        </Container>
      </section>

      {/* TECH MOAT */}
      <section className="section-rule bg-card/30">
        <Container className="section-pad-lg">
          <div className="max-w-3xl">
            <div className="editorial-eyebrow">The technology underneath</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              The hotel you experience is half of what we built.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              The other half is software. Most independent boutique hotels rent their
              software stack from generic vendors. We built ours, which is why direct
              booking on this site feels different — and why we can keep doing more for
              direct guests over time.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Building2,
                title: 'Zenvana PMS',
                text: 'Our in-house property management system runs check-ins, housekeeping, room availability, and rate calendars across all seven properties from one shift screen.',
              },
              {
                icon: Cog,
                title: 'Direct booking engine',
                text: 'The booking flow you used to land here is owned by us — no third-party ABE. Faster, cleaner, and we can ship a new field on Tuesday if it helps a guest on Wednesday.',
              },
              {
                icon: LineChart,
                title: 'Dynamic pricing & inventory',
                text: 'Real-time rate parity, demand-aware pricing, and OTA inventory sync — built around our properties, not retrofitted onto a chain template.',
              },
              {
                icon: Wrench,
                title: 'AlphaClick+ POS',
                text: 'F&B at Feasta runs on our restaurant POS — same data layer as the hotel, so a room charge from dinner shows up on check-out without manual entry.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="group rounded-[1.5rem] border border-border/60 bg-background/85 p-5 transition duration-500 ease-editorial hover:-translate-y-0.5 hover:border-gold-300/40 hover:shadow-gold-glow sm:p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background transition group-hover:bg-gold-300 group-hover:text-ink-800">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-4 font-serif text-xl tracking-[-0.02em] text-foreground sm:text-2xl">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {text}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-[1.75rem] border border-gold-300/40 bg-gold-50/5 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <Compass className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
              <div>
                <h3 className="font-serif text-xl tracking-[-0.02em] text-foreground sm:text-2xl">
                  What this means for you, the guest
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                  Faster check-ins, fewer moments of friction, and a programme like Stay
                  Direct that we can actually fund — because the savings from cutting OTA
                  commissions go back into wallet credits, late check-outs, and free
                  upgrade windows for direct guests. The technology is invisible.
                  The behaviour it enables is the point.
                </p>
                <Link
                  href="/stay-direct"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-gold-400"
                >
                  See the Stay Direct programme
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* SERVICE ETHIC */}
      <section className="section-rule">
        <Container className="section-pad-lg">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="photo-card aspect-[16/10]">
                <Image
                  src="/images/dehradun/Lucury room 1.png"
                  alt="Editorial interior at Zenvana Hotels Dehradun"
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="editorial-eyebrow">Service ethic</div>
              <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
                We measure hospitality in mornings, not minutes.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                The standards we hold ourselves to are written in plain English, posted in
                every back-of-house, and reviewed every quarter. None of them are about
                upselling. All of them are about how a guest feels at three specific
                moments — the first ten minutes of arrival, the morning, and the moment
                they walk out the door for the last time.
              </p>
              <ul className="mt-6 space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
                <li className="flex items-start gap-3">
                  <HeartHandshake className="mt-1 h-4 w-4 shrink-0 text-gold-400" />
                  We greet, we do not process.
                </li>
                <li className="flex items-start gap-3">
                  <Handshake className="mt-1 h-4 w-4 shrink-0 text-gold-400" />
                  We solve, we do not escalate.
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-gold-400" />
                  We remember, we do not repeat.
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* WHAT'S COMING */}
      <section className="section-rule bg-card/40">
        <Container className="section-pad-lg">
          <div className="max-w-3xl">
            <div className="editorial-eyebrow">Where we&apos;re going</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              The next chapter is uphill.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              Seven hotels on Rajpur Road is the foundation. The road from here climbs.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                tag: 'Coming 2026',
                title: 'Zenvana Mussoorie',
                text: 'Our signature flagship in the foothills — purpose-built for slower stays, framed views, and the editorial standard the rest of the collection is moving toward.',
                href: '/mussoorie',
              },
              {
                tag: 'Always live',
                title: 'The Zenvana Journal',
                text: 'Local guides, weekend itineraries, and the kind of context that makes the trip work — not the kind that pads a blog.',
                href: '/blog',
              },
              {
                tag: 'Direct loyalty',
                title: 'Stay Direct, compounded',
                text: 'Wallet credits today. Cross-property recognition tomorrow. We are building the most useful loyalty programme a small operator can offer — quietly, in the background.',
                href: '/stay-direct',
              },
            ].map((c) => (
              <Link
                key={c.title}
                href={c.href}
                className="group rounded-[1.5rem] border border-border/60 bg-background/85 p-6 transition duration-500 ease-editorial hover:-translate-y-0.5 hover:border-gold-300/40 hover:shadow-gold-glow"
              >
                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold-400">
                  {c.tag}
                </div>
                <h3 className="mt-3 font-serif text-2xl tracking-[-0.02em] text-foreground sm:text-3xl">
                  {c.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {c.text}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground transition group-hover:translate-x-0.5">
                  Read more
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="section-rule">
        <Container className="section-pad">
          <div className="overflow-hidden rounded-[2rem] bg-signature-gradient px-6 py-12 text-white sm:px-8 sm:py-14 lg:px-10 lg:py-16">
            <div className="text-center">
              <div className="editorial-eyebrow text-white/70">Let&apos;s pick a stay</div>
              <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
                Read the room. Pick the trip.
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
                  Talk to us
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
            Browse the collection
          </Link>
        </div>
      </div>
    </main>
  )
}
