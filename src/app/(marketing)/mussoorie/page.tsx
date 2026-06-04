import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  Cloud,
  HelpCircle,
  Mountain,
  Phone,
  Sparkles,
  Sunrise,
  TreePine,
} from 'lucide-react'

import { Container } from '@/components/Container'
import { ContactForm } from '@/components/ContactForm'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbJsonLd, faqPageJsonLd } from '@/lib/structured-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Zenvana Mussoorie · The signature flagship, opening 2026',
  description:
    'Our purpose-built signature hotel in the Mussoorie foothills. A slower, more considered stay above Dehradun. Join the wait-list for opening rates and pre-launch invitations.',
  keywords: [
    'Mussoorie hotels',
    'best hotel in Mussoorie',
    'luxury hotel Mussoorie',
    'boutique hotel Mussoorie',
    'Zenvana Mussoorie',
    'new hotel Mussoorie 2026',
    'mountain stay Uttarakhand',
  ],
  alternates: { canonical: '/mussoorie' },
  openGraph: {
    title: 'Zenvana Mussoorie · Opening 2026',
    description:
      'A signature flagship hotel in the Mussoorie foothills. Join the wait-list for opening rates.',
    url: `${SITE_URL}/mussoorie`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/dehradun/foothills-editorial.jpg`,
        alt: 'The Mussoorie foothills — Zenvana flagship coming 2026',
      },
    ],
  },
}

const FAQS = [
  {
    question: 'When is Zenvana Mussoorie opening?',
    answer:
      'Targeted soft-opening in late 2026, with early-access invitations going to wait-list members first. Construction is underway on the foothill site; we will share regular updates with the wait-list.',
  },
  {
    question: 'Where exactly will the property be located?',
    answer:
      'In the foothills above Dehradun, on the Mussoorie road. The exact address and site map will be shared with wait-list members in the run-up to opening — early enough to plan a visit, but private until then.',
  },
  {
    question: 'How will Zenvana Mussoorie be different from the Dehradun properties?',
    answer:
      'It is being designed as our signature flagship — larger rooms, an editorial-grade interior brief, framed views of the Doon valley, and a slower-paced operating model focused on multi-night leisure stays rather than quick city stops.',
  },
  {
    question: 'What does joining the wait-list get me?',
    answer:
      'Pre-public opening rates (locked at 30% under projected list rate for the first 90 days), priority on the most-requested room types, and an invitation to the soft-opening weekend before public reservations begin.',
  },
  {
    question: 'Where can I stay until then?',
    answer:
      'Our seven hotels on Rajpur Road, Dehradun are open and operating today. Many wait-list guests use the Dehradun cluster as a base while planning to be among the first into Mussoorie when it opens.',
  },
  {
    question: 'Is the wait-list binding?',
    answer:
      'No. Joining is non-binding and free. You can step off it any time, and we will only email about Mussoorie unless you opt-in to broader Zenvana updates.',
  },
]

export default function MussooriePage() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Zenvana Mussoorie', url: `${SITE_URL}/mussoorie` },
  ]

  return (
    <main className="mobile-cta-pad bg-background text-foreground">
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), faqPageJsonLd(FAQS)]} />

      {/* HERO */}
      <section className="relative isolate overflow-hidden text-white">
        <div className="absolute inset-0">
          <Image
            src="/images/dehradun/foothills-editorial.jpg"
            alt="Mussoorie foothills above Dehradun"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-hero-shade" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(200,168,90,0.16),transparent_55%)]" />
        </div>

        <Container className="relative py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/40 bg-gold-50/8 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.28em] text-gold-200 backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Opening 2026 · Wait-list open
            </span>
            <h1 className="editorial-display mt-6 text-4xl font-semibold leading-[0.94] sm:text-5xl lg:text-7xl">
              <span className="gold-text">Zenvana Mussoorie.</span>
              <br />
              The flagship is climbing.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
              A purpose-built signature hotel in the Mussoorie foothills, above Dehradun.
              Slower, larger, and quieter than anything we have built before — and our
              clearest expression yet of what a Zenvana stay can feel like.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#waitlist"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-300 px-5 py-3 text-sm font-medium text-ink-800 transition hover:bg-gold-200"
              >
                <Bell className="h-4 w-4" />
                Join the wait-list
              </Link>
              <Link
                href="/hotels"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/16"
              >
                Stay with us in Dehradun
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* CONCEPT STRIP */}
      <section className="border-y border-border/60 bg-card/40">
        <Container className="py-8 sm:py-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              { headline: 'Signature tier', sub: 'Our most considered stay' },
              { headline: 'Foothills', sub: 'Above Dehradun, below Mussoorie' },
              { headline: '~25 keys', sub: 'Intimate, intentional scale' },
              { headline: 'Late 2026', sub: 'Soft-opening for wait-list first' },
            ].map((s) => (
              <div
                key={s.sub}
                className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-center sm:px-5 sm:py-4"
              >
                <div className="font-serif text-xl tracking-[-0.02em] text-foreground sm:text-2xl">
                  {s.headline}
                </div>
                <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* THE STORY */}
      <section className="section-rule">
        <Container className="section-pad-lg">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <div className="editorial-eyebrow">The story</div>
              <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
                Designed for the kind of trip that doesn&apos;t want to leave.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Most Mussoorie stays are quick — a Friday up, a Sunday down. We are
                building the opposite: a property where check-out feels like an
                interruption. Bigger rooms, framed views, slower mornings, and a kitchen
                worth eating in three nights running.
              </p>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                The brief is editorial, not corporate. The site, the architect, and the
                interior team have all been picked for one reason — they get the brief
                without us having to over-explain it.
              </p>
            </div>
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="photo-card col-span-2 aspect-[16/10]">
                  <Image
                    src="/images/dehradun/foothills-editorial.jpg"
                    alt="Mussoorie foothill landscape"
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                </div>
                <div className="photo-card aspect-square">
                  <Image
                    src="/images/dehradun/family-stay-editorial.jpg"
                    alt="Editorial mountain stay"
                    fill
                    sizes="(max-width: 768px) 50vw, 30vw"
                    className="object-cover"
                  />
                </div>
                <div className="photo-card aspect-square">
                  <Image
                    src="/images/dehradun/rajpur-road-editorial.jpg"
                    alt="Editorial reference shot for Mussoorie property"
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

      {/* WHAT TO EXPECT */}
      <section className="section-rule bg-card/40">
        <Container className="section-pad-lg">
          <div className="max-w-3xl">
            <div className="editorial-eyebrow">What to expect</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              The ingredients are picked. The room is being made.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              An early sketch of what guests will find when the doors open.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Mountain,
                title: 'Framed valley views',
                text: 'Every room oriented around the Doon valley line, with a deliberately small key count to keep sight-lines clean.',
              },
              {
                icon: TreePine,
                title: 'Foothill calm',
                text: 'A site selected for quiet — set back from the main road, walking trails into the deodar line, and a kitchen garden at the back.',
              },
              {
                icon: Sunrise,
                title: 'Slower mornings',
                text: 'Breakfast served late on purpose. A library room. No business centre. No conference circular.',
              },
              {
                icon: Cloud,
                title: 'Year-round mood',
                text: 'Designed for monsoon mist, winter light, and shoulder-season golden hours — the three reasons Mussoorie has always rewarded a longer stay.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-[1.5rem] border border-border/60 bg-background/85 p-5 sm:p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background">
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
        </Container>
      </section>

      {/* WAIT-LIST CAPTURE */}
      <section id="waitlist" className="section-rule scroll-mt-24">
        <Container className="section-pad-lg">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <div className="editorial-eyebrow">Be among the first inside</div>
              <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
                The wait-list, briefly explained.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Join below and you will be the first to hear the opening date, the first
                to lock pre-launch rates (30% under projected list for the first 90
                days), and the first invited to the soft-opening weekend. We will email
                rarely — only when there is real news.
              </p>
              <ul className="mt-6 space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
                <li className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-gold-400" />
                  Pre-launch rates locked for the first 90 days
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-gold-400" />
                  Priority on the most-requested room types
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-gold-400" />
                  Soft-opening invitation before public reservations
                </li>
              </ul>
              <p className="mt-6 text-xs italic text-muted-foreground sm:text-sm">
                Free, non-binding, unsubscribe in one click. We will only email about
                Mussoorie unless you opt-in to wider Zenvana updates.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="quiet-card p-5 sm:p-7">
                <div className="mb-5">
                  <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    Wait-list form
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Use the message field to tell us when you&apos;re hoping to visit and
                    your preferred room style — it helps us route the soft-opening
                    invitations sensibly.
                  </p>
                </div>
                <ContactForm />
              </div>
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
              Honest answers, ahead of opening.
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

      {/* MEANWHILE */}
      <section className="section-rule">
        <Container className="section-pad">
          <div className="overflow-hidden rounded-[2rem] bg-signature-gradient px-6 py-12 text-white sm:px-8 sm:py-14 lg:px-10 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <div className="editorial-eyebrow text-white/70">Meanwhile</div>
                <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
                  Stay with us in Dehradun while the foothills get ready.
                </h2>
                <p className="mt-5 text-sm leading-7 text-white/82 sm:text-base sm:leading-8">
                  Seven boutique hotels on or near Rajpur Road. Seven different moods. The
                  same operating standard the Mussoorie flagship will be built on.
                </p>
              </div>
              <div className="lg:col-span-5">
                <div className="flex flex-wrap gap-3 lg:justify-end">
                  <Link
                    href="/hotels"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-300 px-5 py-3 text-sm font-medium text-ink-800 transition hover:bg-gold-200"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    Browse the collection
                  </Link>
                  <Link
                    href="/the-zenvana-difference"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/16"
                  >
                    The Zenvana difference
                  </Link>
                </div>
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
            href="#waitlist"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background"
          >
            <Bell className="h-4 w-4" />
            Join the wait-list
          </Link>
        </div>
      </div>
    </main>
  )
}
