import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Crown,
  HelpCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Wallet,
  XCircle,
} from 'lucide-react'

import { Container } from '@/components/Container'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbJsonLd, faqPageJsonLd } from '@/lib/structured-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Stay Direct · Best Rate Guarantee at Zenvana Hotels Dehradun',
  description:
    'Book direct on zenvanahotels.com for the best public rate, free upgrade window, late check-out, and ₹500 wallet credit on every stay. No fine print.',
  keywords: [
    'book direct hotel Dehradun',
    'best rate guarantee Dehradun',
    'Zenvana Stay Direct',
    'hotel direct booking benefits',
    'late checkout Dehradun',
  ],
  alternates: { canonical: '/stay-direct' },
  openGraph: {
    title: 'Stay Direct · Best Rate Guarantee at Zenvana Hotels',
    description:
      'Four small promises that make booking direct quietly better than any OTA route.',
    url: `${SITE_URL}/stay-direct`,
    type: 'website',
  },
}

const FAQS = [
  {
    question: 'How does the best-rate guarantee work?',
    answer:
      'If you find the same room for the same dates cheaper on any major OTA (MakeMyTrip, Booking, Agoda, Expedia, Adani One) within 24 hours of your direct booking, send us the screenshot. We will match the rate and add ₹500 to your wallet for the inconvenience.',
  },
  {
    question: 'What is the free upgrade window?',
    answer:
      'For all direct bookings we open a 24-hour window before your arrival. If a higher tier room is unsold for your dates, you get lifted into it at no extra charge. It is automatic — no email needed.',
  },
  {
    question: 'How does late check-out till 1 PM work?',
    answer:
      'Standard check-out is 11 AM. Direct guests get the room until 1 PM at no charge, subject to housekeeping and arrivals on your check-out day. We will confirm at the time of check-in.',
  },
  {
    question: 'Where can I spend the ₹500 wallet credit?',
    answer:
      'Anywhere in the Zenvana ecosystem — F&B at Feasta, room upgrades on the same stay, or saved for a future booking on any of our properties. It does not expire for 12 months.',
  },
  {
    question: 'Do these benefits apply to OTA bookings?',
    answer:
      'No. The Stay Direct programme is funded by what we save on OTA commissions. Booking on MakeMyTrip, Booking, etc. is welcome — but those bookings get the standard rate and standard check-out.',
  },
  {
    question: 'Are there any blackout dates?',
    answer:
      'No blackout dates on the rate match. Free upgrades and late check-out are subject to availability — peak weekends and event dates may have less flex, but we will always try.',
  },
]

export default function StayDirectPage() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Stay Direct', url: `${SITE_URL}/stay-direct` },
  ]

  const benefits = [
    {
      icon: ShieldCheck,
      title: 'Best public rate, guaranteed',
      text: 'Find the same dates cheaper on any OTA — we will match it and add ₹500 to your wallet.',
      bullet: 'Match-or-credit · 24-hour window',
    },
    {
      icon: Crown,
      title: 'Free upgrade window',
      text: 'A 24-hour pre-arrival window where we lift direct guests a tier when rooms allow.',
      bullet: 'Automatic · No email needed',
    },
    {
      icon: Clock,
      title: 'Late check-out till 1 PM',
      text: 'An extra two hours at no charge. Easier mornings, lighter exits, calmer family travel.',
      bullet: 'Subject to availability',
    },
    {
      icon: Wallet,
      title: '₹500 wallet on every stay',
      text: 'Spend on F&B at Feasta, on the next room upgrade, or save it for a future booking.',
      bullet: '12-month validity · Cross-property',
    },
  ]

  const compare = [
    {
      feature: 'Best public rate',
      direct: true,
      ota: false,
    },
    {
      feature: 'Free upgrade window (24h pre-arrival)',
      direct: true,
      ota: false,
    },
    {
      feature: 'Late check-out till 1 PM',
      direct: true,
      ota: false,
    },
    {
      feature: '₹500 wallet credit on every stay',
      direct: true,
      ota: false,
    },
    {
      feature: 'Direct coordination with property team',
      direct: true,
      ota: false,
    },
    {
      feature: 'Free cancellation up to 48 hours',
      direct: true,
      ota: 'partial' as const,
    },
    {
      feature: 'Loyalty across all 7 hotels',
      direct: true,
      ota: false,
    },
  ]

  return (
    <main className="mobile-cta-pad bg-background text-foreground">
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), faqPageJsonLd(FAQS)]} />

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink-gradient text-white">
        <div className="absolute inset-0 opacity-[0.18] mix-blend-soft-light pointer-events-none">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,_rgba(200,168,90,0.3),_transparent_55%)]" />
        </div>
        <Container className="relative py-16 sm:py-20 lg:py-28">
          <div className="max-w-3xl">
            <span className="stay-direct-pill">
              <Sparkles className="h-3 w-3" />
              The Zenvana direct programme
            </span>
            <h1 className="editorial-display mt-6 text-4xl font-semibold leading-[0.94] sm:text-5xl lg:text-7xl">
              Book direct, and <span className="gold-text">we make it worth it.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              Four small promises that make booking on zenvanahotels.com quietly better
              than any OTA route. No fine print. No mailing list to subscribe to. Just a
              fair deal between us and the people who choose to book with us directly.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/hotels"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-300 px-5 py-3 text-sm font-medium text-ink-800 transition hover:bg-gold-200"
              >
                <CalendarCheck className="h-4 w-4" />
                Book direct now
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/14"
              >
                How it works
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* BENEFITS GRID */}
      <section id="how-it-works" className="section-rule bg-background">
        <Container className="section-pad-lg">
          <div className="max-w-3xl">
            <div className="editorial-eyebrow">The four promises</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              Small, specific, and quietly load-bearing.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              Every benefit is automatic the moment you complete a direct booking. No code
              to apply, nothing to claim, nothing to chase later.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-6">
            {benefits.map(({ icon: Icon, title, text, bullet }) => (
              <article
                key={title}
                className="group rounded-[1.6rem] border border-border/60 bg-card/80 p-6 transition duration-500 ease-editorial hover:-translate-y-0.5 hover:border-gold-300/50 hover:shadow-gold-glow sm:p-7 dark:bg-card/60"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition group-hover:bg-gold-300 group-hover:text-ink-800">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl tracking-[-0.02em] text-foreground">
                      {title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                      {text}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      <BadgeCheck className="h-3 w-3 text-gold-400" />
                      {bullet}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* DIRECT vs OTA */}
      <section className="section-rule bg-card/30">
        <Container className="section-pad-lg">
          <div className="max-w-3xl">
            <div className="editorial-eyebrow">Direct vs. OTA</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              The same hotel, in two different ways.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              Both routes work. One quietly does more.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-border/60 bg-background">
            <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] items-stretch text-sm sm:grid-cols-[2fr_1fr_1fr] sm:text-base">
              <div className="border-b border-border/60 bg-card/50 px-4 py-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground sm:px-6">
                What you get
              </div>
              <div className="border-b border-l border-border/60 bg-foreground px-3 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-background sm:px-6">
                Stay Direct
              </div>
              <div className="border-b border-l border-border/60 bg-card/50 px-3 py-4 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground sm:px-6">
                Via OTA
              </div>

              {compare.map((row, idx) => (
                <RowFragment key={row.feature} row={row} alt={idx % 2 === 1} />
              ))}
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-xs text-muted-foreground sm:text-sm">
            We are not anti-OTA. They reach travellers we cannot. But the math behind
            commissions means we can pass real value to direct guests in a way OTAs
            structurally cannot.
          </p>
        </Container>
      </section>

      {/* HOW TO BOOK */}
      <section className="section-rule">
        <Container className="section-pad-lg">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <div className="editorial-eyebrow">How to book direct</div>
              <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
                Three steps. No code required.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
                Stay Direct benefits apply automatically the moment you complete the
                booking. There is nothing to enter, claim, or remember.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/hotels"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-95"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Browse hotels
                </Link>
                <a
                  href="tel:+919084051774"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-5 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  <Phone className="h-4 w-4" />
                  Speak to reservations
                </a>
              </div>
            </div>

            <ol className="space-y-3 lg:col-span-7">
              {[
                {
                  title: 'Pick the property and dates',
                  text: 'Compare the seven hotels on the listing page or jump straight to the one you have in mind.',
                },
                {
                  title: 'Reserve with the direct booking engine',
                  text: 'Card payments via Razorpay. Confirmation in your inbox within seconds, with the property\'s direct contact attached.',
                },
                {
                  title: 'Show up — the rest is automatic',
                  text: 'The match guarantee applies for 24 hours, the upgrade window opens before arrival, late check-out and the wallet credit show on departure.',
                },
              ].map((step, i) => (
                <li
                  key={step.title}
                  className="flex gap-5 rounded-[1.4rem] border border-border/60 bg-card/70 p-5 sm:p-6"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-300 text-ink-800">
                    <span className="font-serif text-xl">{i + 1}</span>
                  </div>
                  <div>
                    <div className="font-serif text-xl tracking-[-0.02em] text-foreground sm:text-2xl">
                      {step.title}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="section-rule bg-background">
        <Container className="section-pad-lg">
          <div className="mx-auto max-w-3xl text-center">
            <div className="editorial-eyebrow">Useful to know</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              Stay Direct, in your own words.
            </h2>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-3">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group quiet-card p-5 sm:p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium tracking-tight text-foreground sm:text-lg">
                  <span className="flex items-start gap-3">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                    {faq.question}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 pl-7 text-sm leading-7 text-muted-foreground">
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
              <div className="editorial-eyebrow text-white/70">Ready when you are</div>
              <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
                A better booking, in three taps.
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
                  Email reservations
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
            aria-label="Call reservations"
          >
            <Phone className="h-4.5 w-4.5" />
          </a>
          <Link
            href="/hotels"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background"
          >
            <CalendarCheck className="h-4 w-4" />
            Book direct
          </Link>
        </div>
      </div>
    </main>
  )
}

function RowFragment({
  row,
  alt,
}: {
  row: { feature: string; direct: boolean; ota: boolean | 'partial' }
  alt: boolean
}) {
  const bg = alt ? 'bg-card/30' : 'bg-background'
  return (
    <>
      <div className={`border-b border-border/60 ${bg} px-4 py-4 text-foreground/90 sm:px-6`}>
        {row.feature}
      </div>
      <div className={`border-b border-l border-border/60 ${bg} px-3 py-4 text-center sm:px-6`}>
        {row.direct ? (
          <CheckCircle2 className="mx-auto h-5 w-5 text-tier-essential" />
        ) : (
          <XCircle className="mx-auto h-5 w-5 text-muted-foreground/40" />
        )}
      </div>
      <div className={`border-b border-l border-border/60 ${bg} px-3 py-4 text-center sm:px-6`}>
        {row.ota === true ? (
          <CheckCircle2 className="mx-auto h-5 w-5 text-tier-essential" />
        ) : row.ota === 'partial' ? (
          <span className="text-xs text-muted-foreground">Sometimes</span>
        ) : (
          <XCircle className="mx-auto h-5 w-5 text-muted-foreground/40" />
        )}
      </div>
    </>
  )
}
