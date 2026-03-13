import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Coffee,
  MapPin,
  Mountain,
  MoonStar,
  ShieldCheck,
  Sparkles,
  Trees,
  Users,
} from 'lucide-react'

import { getPublicProperties } from '@/lib/api'
import { HeroBookBar } from './HeroBookBar'

export const metadata: Metadata = {
  title: 'Zenvana Hotels | Dehradun stays, book direct',
  description:
    'Thoughtfully located stays in Dehradun, shaped by foothill calm, warm hospitality, and the ease of booking direct.',
}

const principles: {
  icon: LucideIcon
  title: string
  text: string
}[] = [
    {
      icon: Sparkles,
      title: 'Considered stays',
      text: 'Thoughtfully located, quietly designed, and made to feel easy from the first glance.',
    },
    {
      icon: ShieldCheck,
      title: 'Warm hospitality',
      text: 'Service that feels attentive, personal, and never overdone.',
    },
    {
      icon: Trees,
      title: 'Book direct',
      text: 'Clear communication, straightforward value, and a smoother arrival from the outset.',
    },
  ]

const narrativeMoments: {
  number: string
  icon: LucideIcon
  title: string
  text: string
}[] = [
    {
      number: '01',
      icon: MapPin,
      title: 'Rajpur Road',
      text: "Close to the city's best-known address, where cafés, movement, and everyday Dehradun life come together.",
    },
    {
      number: '02',
      icon: MoonStar,
      title: 'Foothill calm',
      text: 'A softer rhythm of mornings, greener edges, and stays that feel a little more unhurried.',
    },
    {
      number: '03',
      icon: Clock3,
      title: 'Easy arrival',
      text: 'Clear directions, responsive teams, and a booking journey that feels polished from the start.',
    },
    {
      number: '04',
      icon: Coffee,
      title: 'Longer exhale',
      text: 'Well suited to weekends, family stays, and trips that ask for comfort without excess.',
    },
  ]

const directReasons: {
  icon: LucideIcon
  title: string
  text: string
}[] = [
    {
      icon: BadgeCheck,
      title: 'Direct benefits',
      text: 'A clearer booking experience, with value presented simply and well.',
    },
    {
      icon: Check,
      title: 'Better coordination',
      text: 'Special requests and arrival details are easier to handle when you book directly.',
    },
    {
      icon: Users,
      title: 'More personal service',
      text: 'A more direct connection to the team before you arrive.',
    },
    {
      icon: Mountain,
      title: 'Local perspective',
      text: 'Stays shaped by the mood of Dehradun, from city access to foothill quiet.',
    },
    {
      icon: Sparkles,
      title: 'Thoughtful value',
      text: 'Offers and rates that feel considered rather than noisy.',
    },
    {
      icon: ShieldCheck,
      title: 'A calmer process',
      text: 'Less friction, less confusion, and more confidence from booking to check-in.',
    },
  ]

const faqs = [
  {
    q: 'Why book direct with Zenvana?',
    a: 'Booking direct gives you a smoother line to the property team, clearer communication before arrival, and access to selected direct-only offers when available.',
  },
  {
    q: 'Are Zenvana stays suited to families?',
    a: 'Yes. Many guests choose Zenvana for stays that feel comfortable, practical, and easy to settle into with family.',
  },
  {
    q: 'Do you offer seasonal or extended-stay rates?',
    a: 'Selected dates and stays may include seasonal offers or longer-stay value. The latest options are available on the booking journey.',
  },
]

export default async function HomePage() {
  const properties = await getPublicProperties()
  const heroProperties = properties.map((p) => ({
    slug: p.slug,
    publicName: p.publicName,
  }))

  return (
    <main className="bg-background text-foreground">
      <HeroSection properties={heroProperties} />
      <div className="hidden lg:block">
        <EditorialPreludeSection />
        <VisualEssaySection />
        <NarrativeSection />
        <DirectBookingSection />
      </div>
      <OfferStripSection />
      <FaqSection />
    </main>
  )
}

function HeroSection({
  properties,
}: {
  properties: { slug: string; publicName: string }[]
}) {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#08111f] text-white">
      <div className="absolute inset-0">
        <Image
          src="/images/dehradun/dehradun-hero.jpg"
          alt="Dehradun foothills and Rajpur Road atmosphere at golden hour"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,12,22,0.24)_0%,rgba(6,12,22,0.40)_30%,rgba(6,12,22,0.72)_72%,rgba(6,12,22,0.92)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(219,230,76,0.12),transparent_28%),radial-gradient(circle_at_80%_16%,rgba(116,195,101,0.10),transparent_24%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[80svh] w-full flex-col justify-end px-4 pb-6 pt-4 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8 lg:pb-10">
        <div className="max-w-[920px]">
          <h1 className="mt-3 max-w-[980px] font-serif text-[clamp(2.5rem,6vw,7rem)] leading-[0.92] tracking-[-0.05em] text-white sm:mt-5">
            A better way
            <span className="block text-white">to stay in</span>
            <span className="block text-white">Dehradun.</span>
          </h1>

          <p className="mt-4 max-w-[700px] text-sm leading-7 text-white sm:mt-6 sm:text-base sm:leading-8 lg:text-lg">
            Thoughtfully located stays, warm hospitality, and the ease of booking direct.
          </p>

        </div>

        <div className="mt-6 w-full max-w-[920px] sm:mt-10">
          <HeroBookBar properties={properties} />
        </div>
      </div>
    </section>
  )
}

function EditorialPreludeSection() {
  return (
    <section className="border-t border-border/60 bg-background">
      <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-24">
        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            The Zenvana way
          </div>
          <h2 className="mt-4 max-w-[620px] font-serif text-4xl leading-[0.95] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">
            Hospitality with a calmer point of view.
          </h2>
        </div>

        <div className="grid gap-4">
          {principles.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-[2rem] border border-border/60 bg-card/70 p-6 text-card-foreground shadow-[0_18px_50px_rgba(8,17,31,0.05)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 dark:bg-card/50"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium tracking-tight text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-[640px] text-sm leading-7 text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function VisualEssaySection() {
  return (
    <section className="border-t border-border/60 bg-background">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-[860px]">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            A sense of place
          </div>
          <h2 className="mt-4 font-serif text-4xl leading-[0.95] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">
            From Rajpur Road to the lower hills, Dehradun reveals itself in layers.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          <EditorialImageCard
            className="lg:col-span-7"
            image="/images/dehradun/rajpur-road-editorial.jpg"
            eyebrow="Rajpur Road"
            title="Where the city feels most alive."
            text="A familiar address shaped by cafés, movement, and the everyday rhythm of Dehradun."
            aspect="aspect-[4/5] lg:aspect-[16/18]"
          />

          <div className="grid gap-5 lg:col-span-5">
            <EditorialImageCard
              image="/images/dehradun/foothills-editorial.jpg"
              eyebrow="Foothill quiet"
              title="A gentler side of the city."
              text="Greener surroundings, softer mornings, and a slower mood of stay."
              aspect="aspect-[16/10]"
            />
            <EditorialImageCard
              image="/images/dehradun/family-stay-editorial.jpg"
              eyebrow="Easy stays"
              title="Comfort that feels natural."
              text="Warm, practical, and well suited to weekends, family trips, and longer pauses."
              aspect="aspect-[16/10]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function NarrativeSection() {
  return (
    <section className="border-t border-white/10 bg-[#0a1421] text-white">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-white/45">
              The experience
            </div>
            <h2 className="mt-4 max-w-[560px] font-serif text-4xl leading-[0.95] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Stay close to the city, a little closer to calm.
            </h2>
            <p className="mt-6 max-w-[560px] text-base leading-8 text-white/68">
              Zenvana brings together stays that feel connected to Dehradun while still leaving
              room to slow down.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {narrativeMoments.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.number}
                  className="rounded-[1.8rem] border border-white/10 bg-white/[0.05] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.07]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-[0.28em] text-white/42">
                      {item.number}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-[#dbe64c]">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  <h3 className="mt-5 text-2xl font-medium tracking-tight text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/68">{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function DirectBookingSection() {
  return (
    <section className="border-t border-border/60 bg-background">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.02fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Book direct
            </div>
            <h2 className="mt-4 max-w-[620px] font-serif text-4xl leading-[0.95] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">
              Book direct. Arrive easier.
            </h2>
            <p className="mt-5 max-w-[620px] text-base leading-8 text-muted-foreground">
              A more direct booking journey means clearer communication, better coordination,
              and a smoother start to the stay.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {directReasons.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="rounded-[1.6rem] border border-border/60 bg-card/70 p-5 text-card-foreground shadow-[0_18px_45px_rgba(8,17,31,0.04)] transition-all duration-300 hover:-translate-y-1 dark:bg-card/50"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium tracking-tight text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-[2.25rem]">
              <div className="relative aspect-[4/5]">
                <Image
                  src="/images/dehradun/rajpur-road-editorial.jpg"
                  alt="Editorial Rajpur Road visual"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,31,0.02)_0%,rgba(8,17,31,0.16)_35%,rgba(8,17,31,0.82)_100%)]" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="max-w-[520px] rounded-[1.8rem] border border-white/10 bg-white/[0.08] p-5 text-white backdrop-blur-xl">
                  <div className="text-[11px] uppercase tracking-[0.26em] text-white">
                    A smoother start
                  </div>
                  <p className="mt-3 font-serif text-2xl leading-tight tracking-[-0.03em] text-white">
                    Clear booking, thoughtful service, and a stay that begins well before arrival.
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-sm text-white">
                    <span>Direct booking</span>
                    <ArrowRight className="h-4 w-4" />
                    <span>More ease</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function OfferStripSection() {
  return (
    <section className="border-t border-border/60 bg-background">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-24">
        <div className="overflow-hidden rounded-[2.4rem] bg-[linear-gradient(135deg,#08111f_0%,#10223a_48%,#17402d_100%)] px-6 py-10 text-white shadow-[0_30px_120px_rgba(8,17,31,0.18)] sm:px-8 lg:px-10 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-[800px]">
              <div className="text-[11px] uppercase tracking-[0.3em] text-white/44">
                Selected offers
              </div>
              <h2 className="mt-4 font-serif text-3xl leading-[0.95] tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Seasonal value, presented with restraint.
              </h2>
              <p className="mt-4 max-w-[640px] text-sm leading-7 text-white/72 sm:text-base">
                From time to time, selected stays may include seasonal offers and longer-stay value.
              </p>
            </div>

            <Link
              href="/offers"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.08] px-5 py-3 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/[0.12]"
            >
              Explore offers
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function FaqSection() {
  return (
    <section className="border-t border-border/60 bg-background">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-24">
        <div className="max-w-[760px]">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Useful to know
          </div>
          <h2 className="mt-4 font-serif text-4xl leading-[0.95] tracking-[-0.05em] text-foreground sm:text-5xl">
            A few practical details.
          </h2>
        </div>

        <div className="mt-10 grid gap-4">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="rounded-[1.8rem] border border-border/60 bg-card/70 p-6 text-card-foreground shadow-[0_14px_35px_rgba(8,17,31,0.04)] dark:bg-card/50"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium tracking-tight text-foreground">
                <span>{faq.q}</span>
                <span className="text-muted-foreground">+</span>
              </summary>
              <p className="mt-4 max-w-[900px] text-sm leading-7 text-muted-foreground">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function EditorialImageCard({
  image,
  eyebrow,
  title,
  text,
  aspect,
  className,
}: {
  image: string
  eyebrow: string
  title: string
  text: string
  aspect: string
  className?: string
}) {
  return (
    <article className={className}>
      <div className={`group relative overflow-hidden rounded-[2rem] ${aspect}`}>
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,31,0.04)_0%,rgba(8,17,31,0.18)_45%,rgba(8,17,31,0.86)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 lg:p-7">
          <div className="text-[11px] uppercase tracking-[0.28em] text-white">{eyebrow}</div>
          <h3 className="mt-3 max-w-[640px] font-serif text-2xl leading-tight tracking-[-0.03em] text-white sm:text-3xl">
            {title}
          </h3>
          <p className="mt-3 max-w-[620px] text-sm leading-7 text-white">{text}</p>
        </div>
      </div>
    </article>
  )
}
