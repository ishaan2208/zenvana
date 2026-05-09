import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck,
  Heart,
  HelpCircle,
  PartyPopper,
  Phone,
  Sparkles,
  Users,
  Utensils,
} from 'lucide-react'

import { Container } from '@/components/Container'
import { EventBookingForm } from '@/components/EventBookingForm'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbJsonLd, faqPageJsonLd } from '@/lib/structured-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Weddings & Events on Rajpur Road · Zenvana Hotels Dehradun',
  description:
    'Host weddings, corporate offsites, and private celebrations across the Zenvana cluster on Rajpur Road, Dehradun. 150 rooms across the collection and a 150-guest rooftop hall.',
  keywords: [
    'wedding venue Dehradun',
    'wedding hotels Rajpur Road',
    'corporate offsite Dehradun',
    'event venue Dehradun',
    'destination wedding Dehradun',
    'private celebration venue Dehradun',
  ],
  alternates: { canonical: '/weddings' },
  openGraph: {
    title: 'Weddings & Events on Rajpur Road · Zenvana Hotels',
    description:
      'A wedding venue cluster on Rajpur Road. 150 rooms across the Zenvana collection plus a 150-guest rooftop hall.',
    url: `${SITE_URL}/weddings`,
    type: 'website',
  },
}

const FAQS = [
  {
    question: 'How many rooms can Zenvana absorb for a single event?',
    answer:
      'Across our five properties on Rajpur Road we have 150 rooms in total — enough to host weddings of 200–300 guests as a full cluster takeover, plus a rooftop hall that seats up to 150 for the ceremony, sangeet, or reception itself. For larger headcounts we will work with you on a phased plan.',
  },
  {
    question: 'Do you handle catering in-house?',
    answer:
      'Yes — Feasta by Zenvana is our in-house F&B team and handles all event catering. Custom menus across North Indian, continental, Chinese, regional, and Jain options are available with the proposal.',
  },
  {
    question: 'Can guests stay across multiple Zenvana properties for one event?',
    answer:
      'Absolutely — that is our core advantage. With five hotels on the same stretch of Rajpur Road, you can place close family at one property and out-of-town guests at another, with shared transport between them.',
  },
  {
    question: 'What kind of events do you typically host?',
    answer:
      'Indian weddings (intimate to 300+ guests), corporate offsites and conferences, milestone birthdays, anniversaries, school reunions, and product launches. We regularly host full-cluster weekend takeovers and have done so as recently as last quarter.',
  },
  {
    question: 'How big is the rooftop hall?',
    answer:
      'Our signature rooftop hall comfortably seats up to 150 guests for a ceremony, sangeet, reception dinner, or corporate plenary. It also flexes down for smaller, more intimate setups — round tables, lounge layouts, or a runway for product launches.',
  },
  {
    question: 'Do you have outdoor / lawn space for events?',
    answer:
      'Yes — multiple properties have lawn or rooftop space depending on the event style, in addition to our 150-guest rooftop hall. We will recommend the right venue mix during the planning call based on guest count, weather, and the rituals involved.',
  },
  {
    question: 'How early should I reserve dates for a wedding?',
    answer:
      'Peak Indian wedding seasons (Nov–Feb, Apr–May) book 6–9 months out. For non-peak dates we have hosted events with 8–12 weeks of notice. Send us a proposal request and we will confirm availability within 24 hours.',
  },
]

export default function WeddingsPage() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Weddings & Events', url: `${SITE_URL}/weddings` },
  ]

  const eventTypes = [
    {
      icon: Heart,
      title: 'Weddings',
      text: 'Mehendi, sangeet, haldi, ceremony, reception — across one property or distributed across the cluster, with photography-friendly spaces and a dedicated event captain on every shift.',
      headline: 'Up to 300 guests',
    },
    {
      icon: BriefcaseBusiness,
      title: 'Corporate offsites',
      text: 'Boardroom-style strategy days, all-hands offsites, founder retreats, sales kickoffs. Quiet rooms, reliable Wi-Fi, breakaway zones, and an F&B team that handles dietary specifics without fuss.',
      headline: '20–80 attendees',
    },
    {
      icon: PartyPopper,
      title: 'Private celebrations',
      text: 'Milestone birthdays, anniversaries, school and college reunions, family gatherings. Calmer venues than a banquet hall, with the privacy of a hotel takeover when you need it.',
      headline: 'Custom · 10–150 guests',
    },
  ]

  const proofPoints = [
    {
      headline: '150 rooms',
      sub: 'Across the Zenvana cluster on Rajpur Road',
    },
    {
      headline: '5 properties',
      sub: 'All within a short drive on Rajpur Road',
    },
    {
      headline: '150-guest',
      sub: 'Rooftop hall · indoor + outdoor venues',
    },
    {
      headline: '24-hr',
      sub: 'Event proposal turnaround',
    },
  ]

  return (
    <main className="mobile-cta-pad bg-background text-foreground">
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), faqPageJsonLd(FAQS)]} />

      {/* HERO */}
      <section className="relative isolate overflow-hidden text-white">
        <div className="absolute inset-0">
          <Image
            src="/images/dehradun/IMG_4477.JPG"
            alt="Wedding venue at Zenvana Hotels in Dehradun"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-hero-shade" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(200,168,90,0.18),transparent_55%)]" />
        </div>

        <Container className="relative py-20 sm:py-24 lg:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.28em] text-white/82 backdrop-blur">
              <Sparkles className="h-3 w-3 text-gold-200" />
              Weddings · Corporate · Celebrations
            </span>
            <h1 className="editorial-display mt-6 text-4xl font-semibold leading-[0.94] sm:text-5xl lg:text-7xl">
              The only Rajpur Road brand that can absorb a{' '}
              <span className="gold-text">150-room weekend.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
              Five hotels. One quiet stretch of Rajpur Road. A single event team. One
              kitchen. One proposal. The cluster math that no single boutique on this road
              can match — and a softer, more personal alternative to the big resort
              venues.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#enquire"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-300 px-5 py-3 text-sm font-medium text-ink-800 transition hover:bg-gold-200"
              >
                <CalendarCheck className="h-4 w-4" />
                Request a proposal
              </Link>
              <a
                href="tel:+919084051774"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/16"
              >
                <Phone className="h-4 w-4" />
                Speak to events team
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* PROOF STRIP */}
      <section className="border-y border-border/60 bg-card/40">
        <Container className="py-6 sm:py-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {proofPoints.map((p) => (
              <div
                key={p.headline}
                className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-center sm:px-5 sm:py-4"
              >
                <div className="font-serif text-2xl tracking-[-0.02em] text-foreground sm:text-3xl">
                  {p.headline}
                </div>
                <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
                  {p.sub}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* EVENT TYPES */}
      <section className="section-rule">
        <Container className="section-pad-lg">
          <div className="max-w-3xl">
            <div className="editorial-eyebrow">What we host</div>
            <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
              From a 30-cover dinner to a weekend takeover.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              The cluster flexes around the event, not the other way around.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {eventTypes.map(({ icon: Icon, title, text, headline }) => (
              <article
                key={title}
                className="group relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/80 transition duration-500 ease-editorial hover:-translate-y-1 hover:border-gold-300/40 hover:shadow-editorial dark:bg-card/60"
              >
                <div className="p-6 sm:p-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background transition group-hover:bg-gold-300 group-hover:text-ink-800">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                      {headline}
                    </span>
                  </div>
                  <h3 className="mt-5 font-serif text-2xl tracking-[-0.02em] text-foreground sm:text-3xl">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                    {text}
                  </p>
                </div>
                <div className="h-1 w-full bg-gold-gradient opacity-0 transition group-hover:opacity-100" />
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* CASE STUDY */}
      <section className="section-rule bg-card/40">
        <Container className="section-pad-lg">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <div className="editorial-eyebrow">Case study</div>
              <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
                A full-cluster weekend, end-to-end.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
                A recent client booked the Zenvana cluster for a private weekend.
                Room blocks distributed across multiple properties to keep close family
                next to the rooftop hall and out-of-town guests on quieter floors. The
                rooftop hall hosted the ceremony for 150; catering ran out of a single
                kitchen across both nights; transport ran on a 15-minute loop.
              </p>
              <div className="mt-7 grid grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3 text-center sm:px-4 sm:py-4">
                  <Users className="mx-auto h-4 w-4 text-gold-400" />
                  <div className="mt-2 font-serif text-xl tracking-[-0.02em] text-foreground sm:text-2xl">
                    250+
                  </div>
                  <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Guests
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3 text-center sm:px-4 sm:py-4">
                  <Utensils className="mx-auto h-4 w-4 text-gold-400" />
                  <div className="mt-2 font-serif text-xl tracking-[-0.02em] text-foreground sm:text-2xl">
                    6
                  </div>
                  <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    F&amp;B services
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3 text-center sm:px-4 sm:py-4">
                  <CalendarCheck className="mx-auto h-4 w-4 text-gold-400" />
                  <div className="mt-2 font-serif text-xl tracking-[-0.02em] text-foreground sm:text-2xl">
                    2 nights
                  </div>
                  <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Full takeover
                  </div>
                </div>
              </div>
              <p className="mt-7 text-xs italic text-muted-foreground sm:text-sm">
                Client name redacted. Details available under NDA on request.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="photo-card col-span-2 aspect-[16/10]">
                  <Image
                    src="/images/dehradun/IMG_4505.jpg"
                    alt="Wedding ceremony space at Zenvana Hotels Dehradun"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="photo-card aspect-square">
                  <Image
                    src="/images/dehradun/IMG_4536.JPG"
                    alt="Event setup at Zenvana"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <div className="photo-card aspect-square">
                  <Image
                    src="/images/dehradun/IMG_4660.jpg"
                    alt="Banquet space at Zenvana Hotels"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="section-rule">
        <Container className="section-pad-lg">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <div className="editorial-eyebrow">What we include</div>
              <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
                Less to coordinate. More to enjoy.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
                A standard event proposal covers most of the obvious things. Send us the
                non-obvious things and we will sort those too.
              </p>
            </div>

            <ul className="grid gap-3 lg:col-span-7 sm:grid-cols-2">
              {[
                'Dedicated event captain (single point of contact)',
                'In-house F&B by Feasta · custom menu design',
                'Room blocks across one or multiple properties',
                'Inter-property guest transport on event days',
                'Indoor + rooftop venue options',
                'Mehendi / haldi / sangeet venue setup',
                'Audio-visual + lighting for ceremonies',
                'Complimentary stay for the immediate family on full takeovers',
                'Bridal suite + getting-ready room on wedding day',
                'Late check-out for the entire group on departure day',
              ].map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 rounded-[1.2rem] border border-border/60 bg-card/70 p-4 text-sm leading-7 text-foreground/90 sm:p-5"
                >
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* ENQUIRY FORM */}
      <section id="enquire" className="section-rule bg-card/40">
        <Container className="section-pad-lg">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <div className="editorial-eyebrow">Send us your dates</div>
              <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
                A proposal in your inbox within 24 hours.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
                Tell us a little about the event. We will come back with venue options,
                room availability, sample menus, and an indicative quote — usually within
                one working day.
              </p>
              <div className="mt-7 space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
                <div className="flex items-start gap-3">
                  <Phone className="mt-1 h-4 w-4 shrink-0 text-gold-400" />
                  <div>
                    <div className="text-foreground">+91 90840 51774</div>
                    <div className="text-xs text-muted-foreground">Events team · 10am–8pm IST</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarCheck className="mt-1 h-4 w-4 shrink-0 text-gold-400" />
                  <div>Reply within 24 hours on weekdays.</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="quiet-card p-5 sm:p-7">
                <EventBookingForm />
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
              Practical answers before the planning call.
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
              <div className="editorial-eyebrow text-white/70">Ready to plan?</div>
              <h2 className="editorial-display mt-4 text-3xl sm:text-4xl lg:text-5xl">
                Tell us the date. We&apos;ll handle the road.
              </h2>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="#enquire"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-300 px-5 py-3 text-sm font-medium text-ink-800 transition hover:bg-gold-200"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Request a proposal
                  <ArrowRight className="h-4 w-4" />
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
            aria-label="Call events team"
          >
            <Phone className="h-4.5 w-4.5" />
          </a>
          <Link
            href="#enquire"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background"
          >
            <CalendarCheck className="h-4 w-4" />
            Request a proposal
          </Link>
        </div>
      </div>
    </main>
  )
}
