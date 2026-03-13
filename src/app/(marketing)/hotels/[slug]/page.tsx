import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CalendarCheck,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { getPublicPropertyBySlug, getPublicProperties } from '@/lib/api'
import { Container } from '@/components/Container'
import { Button } from '@/components/Button'
import {
  lodgingBusinessJsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
} from '@/lib/structured-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvana.com'

type Props = { params: Promise<{ slug: string }> }

type PropertyImage = {
  url?: string
  isHero?: boolean
  classification?: string
}

export async function generateStaticParams() {
  const properties = await getPublicProperties()
  return properties.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const property = await getPublicPropertyBySlug(slug)

  if (!property) return { title: 'Hotel not found' }

  const city = property.city ?? ''

  return {
    title: `${property.publicName} by Zenvana | Boutique Hotel in ${city} | Book Direct`,
    description:
      property.descriptionShort ??
      `Book ${property.publicName} directly. ${city}. Thoughtful hospitality and better value when you book with Zenvana.`,
    openGraph: {
      images: getHeroImageUrl(property.images),
    },
  }
}

function normalizeImages(images: unknown): PropertyImage[] {
  if (!Array.isArray(images)) return []
  return images.filter(Boolean) as PropertyImage[]
}

function getHeroImageUrl(images: unknown): string[] {
  const safeImages = normalizeImages(images)
  const hero = safeImages.find((i) => i?.isHero || i?.classification === 'hero')
  const url = hero?.url ?? safeImages[0]?.url
  return url ? [url] : []
}

function getGalleryImages(images: unknown): string[] {
  const safeImages = normalizeImages(images)
    .map((img) => img?.url)
    .filter((url): url is string => Boolean(url))

  return Array.from(new Set(safeImages)).slice(0, 5)
}

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params
  const property = await getPublicPropertyBySlug(slug)
  if (!property) notFound()

  const heroUrl = getHeroImageUrl(property.images)[0]
  const galleryImages = getGalleryImages(property.images)
  const galleryRest = galleryImages.slice(1, 5)

  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Hotels', url: `${SITE_URL}/hotels` },
    { name: property.publicName, url: `${SITE_URL}/hotels/${slug}` },
  ]

  const faqsForLd = property.faqs?.map((f) => ({
    question: f.question,
    answer: f.answer,
  }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(lodgingBusinessJsonLd(property)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)),
        }}
      />
      {faqsForLd && faqsForLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqPageJsonLd(faqsForLd)),
          }}
        />
      )}

      <main className="bg-background text-foreground">
        <PropertyHero
          property={property}
          heroUrl={heroUrl}
        />

        <div className="hidden lg:block">
          <QuickFacts property={property} />
        </div>

        <Container className="py-6 sm:py-10 lg:py-20">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_380px] xl:gap-10">
            <div className="order-2 min-w-0 xl:order-1">
              <OverviewSection property={property} />

              {galleryRest.length > 0 && (
                <GallerySection
                  propertyName={property.publicName}
                  images={galleryRest}
                />
              )}

              {property.roomTypes && property.roomTypes.length > 0 && (
                <RoomsSection roomTypes={property.roomTypes} />
              )}

              {property.faqs && property.faqs.length > 0 && (
                <FaqSection faqs={property.faqs} />
              )}
            </div>

            <aside className="order-1 min-w-0 xl:order-2">
              <BookingSidebar property={property} />
            </aside>
          </div>
        </Container>

        <section className="border-t border-border/60 bg-background">
          <Container className="py-8">
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              All hotels
            </Link>
          </Container>
        </section>
      </main>
    </>
  )
}

function PropertyHero({
  property,
  heroUrl,
}: {
  property: any
  heroUrl?: string
}) {
  return (
    <section className="relative min-h-[60svh] overflow-hidden bg-[#08111f] text-white sm:min-h-[72svh]">
      {heroUrl ? (
        <img
          src={heroUrl}
          alt={property.publicName}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#0b1422_0%,#10233b_52%,#173e2d_100%)]" />
      )}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,12,22,0.20)_0%,rgba(6,12,22,0.38)_28%,rgba(6,12,22,0.72)_72%,rgba(6,12,22,0.92)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(219,230,76,0.10),transparent_26%),radial-gradient(circle_at_78%_12%,rgba(116,195,101,0.08),transparent_22%)]" />

      <Container className="relative flex min-h-[60svh] flex-col justify-end pb-6 pt-20 sm:pb-10 sm:pt-28 lg:pb-14">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[10px] uppercase tracking-[0.28em] text-white/70 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#dbe64c]" />
            Zenvana Stay
          </div>

          <h1 className="mt-5 font-serif text-[clamp(2.8rem,6vw,5.8rem)] leading-[0.94] tracking-[-0.05em] text-white">
            {property.publicName}
          </h1>

          {(property.city || property.state) && (
            <div className="mt-4 flex items-center gap-2 text-sm text-white/76 sm:text-base">
              <MapPin className="h-4 w-4 shrink-0 text-white/65" />
              <span>{[property.city, property.state].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {property.descriptionShort && (
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
              {property.descriptionShort}
            </p>
          )}
        </div>
      </Container>
    </section>
  )
}

function QuickFacts({ property }: { property: any }) {
  const items = [
    {
      icon: BadgeCheck,
      title: 'Book direct',
      text: 'Clearer communication and better coordination before arrival.',
    },
    {
      icon: ShieldCheck,
      title: 'Thoughtful stay',
      text: 'Warm hospitality with a calmer, more considered feel.',
    },
    {
      icon: MapPin,
      title: 'Well placed',
      text: [property.city, property.state].filter(Boolean).join(', ') || 'Dehradun',
    },
  ]

  return (
    <section className="border-b border-border/60 bg-background">
      <Container className="py-6 sm:py-8">
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-border/60 bg-card/70 p-5 text-card-foreground shadow-[0_12px_30px_rgba(8,17,31,0.03)] dark:bg-card/40"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-medium tracking-tight text-foreground">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {item.text}
                    </p>
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

function OverviewSection({ property }: { property: any }) {
  return (
    <section>
      <div className="max-w-3xl">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Overview
        </div>
        <h2 className="mt-4 font-serif text-4xl leading-[0.95] tracking-[-0.05em] text-foreground sm:text-5xl">
          A stay shaped by comfort, ease, and a sense of place.
        </h2>
      </div>

      {property.descriptionLong ? (
        <div
          className="prose prose-neutral mt-8 max-w-none text-muted-foreground dark:prose-invert prose-headings:font-serif prose-headings:text-foreground prose-p:leading-8"
          dangerouslySetInnerHTML={{
            __html: property.descriptionLong.replace(/\n/g, '<br />'),
          }}
        />
      ) : property.descriptionShort ? (
        <p className="mt-8 max-w-3xl text-base leading-8 text-muted-foreground">
          {property.descriptionShort}
        </p>
      ) : (
        <p className="mt-8 max-w-3xl text-base leading-8 text-muted-foreground">
          A thoughtfully located Zenvana stay designed for a smoother, more comfortable
          experience of the city.
        </p>
      )}
    </section>
  )
}

function GallerySection({
  propertyName,
  images,
}: {
  propertyName: string
  images: string[]
}) {
  return (
    <section className="mt-14 sm:mt-16">
      <div className="max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          A closer look
        </div>
        <h2 className="mt-4 font-serif text-3xl leading-[0.96] tracking-[-0.04em] text-foreground sm:text-4xl">
          Moments from the stay.
        </h2>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {images.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className={`overflow-hidden rounded-[1.8rem] border border-border/60 bg-card/40 ${index === 0 ? 'md:col-span-2' : ''
              }`}
          >
            <img
              src={url}
              alt={`${propertyName} image ${index + 2}`}
              className={`w-full object-cover transition-transform duration-700 hover:scale-[1.02] ${index === 0 ? 'h-[380px]' : 'h-[280px]'
                }`}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function RoomsSection({
  roomTypes,
}: {
  roomTypes: Array<{
    id: string | number
    name: string
    shortDescription?: string | null
  }>
}) {
  return (
    <section className="mt-14 border-t border-border/60 pt-14 sm:mt-16 sm:pt-16">
      <div className="max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Rooms
        </div>
        <h2 className="mt-4 font-serif text-3xl leading-[0.96] tracking-[-0.04em] text-foreground sm:text-4xl">
          Spaces designed for a comfortable stay.
        </h2>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {roomTypes.map((rt) => (
          <article
            key={rt.id}
            className="rounded-[1.6rem] border border-border/60 bg-card/70 p-6 text-card-foreground shadow-[0_14px_35px_rgba(8,17,31,0.04)] dark:bg-card/50"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                <BedDouble className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-xl font-medium tracking-tight text-foreground">
                  {rt.name}
                </h3>
                {rt.shortDescription && (
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {rt.shortDescription}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function FaqSection({
  faqs,
}: {
  faqs: Array<{
    id: string | number
    question: string
    answer: string
  }>
}) {
  return (
    <section className="mt-14 border-t border-border/60 pt-14 sm:mt-16 sm:pt-16">
      <div className="max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Useful to know
        </div>
        <h2 className="mt-4 font-serif text-3xl leading-[0.96] tracking-[-0.04em] text-foreground sm:text-4xl">
          A few practical details.
        </h2>
      </div>

      <div className="mt-8 grid gap-4">
        {faqs.map((faq) => (
          <details
            key={faq.id}
            className="rounded-[1.6rem] border border-border/60 bg-card/70 p-6 text-card-foreground shadow-[0_14px_35px_rgba(8,17,31,0.04)] dark:bg-card/50"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium tracking-tight text-foreground">
              <span>{faq.question}</span>
              <span className="text-muted-foreground">+</span>
            </summary>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function BookingSidebar({ property }: { property: any }) {
  return (
    <div className="xl:sticky xl:top-8">
      <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 text-card-foreground shadow-[0_24px_60px_rgba(8,17,31,0.08)] dark:bg-card/50">
        <div className="border-b border-border/60 px-6 py-5 sm:px-7">
          <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Book direct
          </div>
          <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em] text-foreground">
            Stay with Zenvana
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Clear booking, better coordination, and a smoother arrival from the outset.
          </p>
        </div>

        <div className="px-6 py-6 sm:px-7">
          <Button
            href={`/book/${property.slug}`}
            color="blue"
            className="flex w-full items-center justify-center gap-2 rounded-xl"
          >
            <CalendarCheck className="h-4 w-4" aria-hidden />
            Check availability
          </Button>

          <div className="mt-6 space-y-4 border-t border-border/60 pt-6">
            {property.primaryPhone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Phone
                  </div>
                  <a
                    href={`tel:${property.primaryPhone}`}
                    className="mt-1 inline-block text-sm font-medium text-foreground hover:underline"
                  >
                    {property.primaryPhone}
                  </a>
                </div>
              </div>
            )}

            {property.fullAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Address
                  </div>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">
                    {property.fullAddress}
                  </p>
                </div>
              </div>
            )}

            {property.googleMapPlaceUrl && (
              <a
                href={property.googleMapPlaceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                View on map
                <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}