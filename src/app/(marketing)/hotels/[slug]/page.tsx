import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarCheck,
  Camera,
  MapPin,
  Navigation,
  Phone,
  Plane,
  ShieldCheck,
  Sparkles,
  Train,
} from 'lucide-react'

import { getPublicPropertyBySlug, getPublicProperties } from '@/lib/api'
import { Container } from '@/components/Container'
import { Button } from '@/components/Button'
import { PlaneButton } from '@/components/PlaneButton'
import { EmblaImageGallery } from '@/components/EmblaImageGallery'
import { FilterableGallery } from '@/components/FilterableGallery'
import { PropertyMapSection } from '@/components/PropertyMapSection'
import { normalizeGalleryImages, pickHeroAndGallery, type GalleryImage } from '@/lib/media'
import { placesNear, formatKm } from '@/lib/distances'
import { promoOrCouponFromSearchParams } from '@/lib/promo-or-coupon-code'
import {
  lodgingBusinessJsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
} from '@/lib/structured-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'
export const revalidate = 1800
export const dynamicParams = false

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ couponCode?: string; promoCode?: string }>
}
type Property = NonNullable<Awaited<ReturnType<typeof getPublicPropertyBySlug>>>

export async function generateStaticParams() {
  const properties = await getPublicProperties()
  return properties.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const property = await getPublicPropertyBySlug(slug)

  if (!property) {
    return {
      title: 'Hotel not found | Zenvana',
    }
  }

  const location = [property.city, property.state].filter(Boolean).join(', ')
  const { heroUrl } = pickHeroAndGallery(property.images)
  const ogImage = property.ogImageUrl ?? heroUrl

  const title =
    property.seoTitle ??
    `${property.publicName} by Zenvana | Boutique Hotel in ${property.city ?? 'Dehradun'} | Book Direct`
  const description =
    property.seoDescription ??
    property.descriptionShort ??
    `${property.publicName} by Zenvana offers a thoughtful stay in ${location || 'Dehradun'}. Explore rooms, see real property photos, and book direct for a smoother arrival.`

  const canonical = `${SITE_URL}/hotels/${slug}`

  return {
    title,
    description,
    keywords: [
      property.publicName,
      property.city,
      property.state,
      'boutique hotel',
      'hotel in dehradun',
      'book direct hotel',
      'zenvana hotels',
      `${property.publicName} rooms`,
      `${property.publicName} photos`,
    ].filter(Boolean),
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      images: ogImage ? [{ url: ogImage, alt: property.publicName }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  }
}

export default async function PropertyPage({ params, searchParams }: Props) {
  const { slug } = await params
  const q = await searchParams
  const couponCode = promoOrCouponFromSearchParams(q)
  const [property, allProperties] = await Promise.all([
    getPublicPropertyBySlug(slug),
    getPublicProperties().catch(() => []),
  ])
  if (!property) notFound()
  const otherProperties = allProperties.filter((p) => p.slug !== slug).slice(0, 4)

  const galleryData = pickHeroAndGallery(property.images)
  const heroUrl = galleryData.heroUrl
  const galleryImages = galleryData.gallery
  const roomTypes = property.roomTypes ?? []
  const location = [property.city, property.state].filter(Boolean).join(', ') || 'Dehradun'
  const totalImageCount = (heroUrl ? 1 : 0) + galleryImages.length

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

      <main className="page-enter bg-background text-foreground pb-24 xl:pb-0">
        <PropertyHero
          property={property}
          heroUrl={heroUrl}
          location={location}
          galleryImages={galleryImages}
          totalImageCount={totalImageCount}
          couponCode={couponCode}
        />

        <QuickFacts property={property} location={location} />

        <QuickAnchorNav
          hasGallery={galleryImages.length > 0}
          hasRooms={roomTypes.length > 0}
          hasMap={property.latitude != null && property.longitude != null}
          hasFaqs={(property.faqs?.length ?? 0) > 0}
        />

        <Container className="py-12 sm:py-16 lg:py-20">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1.12fr)_380px] xl:gap-12">
            <div className="min-w-0 space-y-20 sm:space-y-24">
              <OverviewSplitSection
                property={property}
                location={location}
                galleryImages={galleryImages}
              />

              {galleryImages.length > 0 && (
                <GallerySection
                  propertyName={property.publicName}
                  images={galleryImages}
                />
              )}

              {roomTypes.length > 0 && (
                <RoomsSection
                  propertySlug={property.slug}
                  roomTypes={roomTypes}
                  couponCode={couponCode}
                />
              )}

              <PropertyMapSection
                propertyName={property.publicName}
                latitude={property.latitude}
                longitude={property.longitude}
                fullAddress={property.fullAddress}
                mapPlaceUrl={property.googleMapPlaceUrl}
              />

              <GettingHereSection property={property} />

              {property.faqs && property.faqs.length > 0 && (
                <FaqSection faqs={property.faqs} />
              )}
            </div>

            <aside className="min-w-0">
              <BookingSidebar
                property={property}
                location={location}
                totalImageCount={totalImageCount}
                couponCode={couponCode}
              />
            </aside>
          </div>
        </Container>

        {otherProperties.length > 0 && (
          <CompareOtherProperties
            currentName={property.publicName}
            others={otherProperties}
          />
        )}

        <section className="border-t border-border/60 bg-background">
          <Container className="py-10">
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-foreground/70 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              The Collection
            </Link>
          </Container>
        </section>

        <PropertyMobileBookingBar property={property} couponCode={couponCode} />
      </main>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  HERO — magazine cover treatment                                    */
/* ------------------------------------------------------------------ */

function PropertyHero({
  property,
  heroUrl,
  location,
  galleryImages,
  totalImageCount,
  couponCode,
}: {
  property: Property
  heroUrl?: string
  location: string
  galleryImages: Array<{ url: string }>
  totalImageCount: number
  couponCode?: string
}) {
  const previewImages = galleryImages.slice(0, 4)

  return (
    <section className="relative isolate overflow-hidden bg-[#06080d] text-white">
      {/* Atmospheric blurred backdrop — image becomes pure ambience */}
      {heroUrl ? (
        <div className="absolute inset-0">
          <Image
            src={heroUrl}
            alt=""
            fill
            className="scale-[1.15] object-cover opacity-45 blur-3xl"
            sizes="100vw"
            priority
            aria-hidden
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#06080d_0%,#0a1426_55%,#0b1f1a_100%)]" />
      )}

      {/* Cinematic darkening — vignette + vertical fade */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(6,8,13,0.35)_0%,rgba(6,8,13,0.75)_55%,rgba(6,8,13,0.96)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,8,13,0.55)_0%,rgba(6,8,13,0.15)_30%,rgba(6,8,13,0.45)_65%,rgba(6,8,13,0.95)_100%)]" />
      {/* Subtle warm + cool color wash, very low opacity */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(219,230,76,0.10),transparent_28%),radial-gradient(circle_at_86%_82%,rgba(120,165,255,0.08),transparent_30%)]" />
      {/* Film-grain feel via dot pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '3px 3px',
        }}
      />

      <Container className="relative z-10">
        {/* Top utility row */}
        <div className="flex items-center justify-between pt-5 sm:pt-6">
          <Link
            href="/hotels"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[0.10]"
          >
            <ArrowLeft className="h-3 w-3 text-white/70 transition group-hover:-translate-x-0.5 group-hover:text-white" />
            <span className="text-[10px] font-medium uppercase tracking-[0.26em] text-white/80">
              Hotels
            </span>
          </Link>

          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.32em] text-white/55">
            <span className="hidden sm:inline">The Collection</span>
            <span className="hidden h-px w-6 bg-white/30 sm:inline-block" />
            <span>Chapter&nbsp;I</span>
          </div>
        </div>

        {/* Featured editorial photo card — sharp, framed, asymmetric */}
        <div className="mt-8 sm:mt-12">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[300px] overflow-hidden rounded-[1.25rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/10 sm:max-w-md sm:rounded-[1.5rem]">
            {heroUrl ? (
              <Image
                src={heroUrl}
                alt={`${property.publicName} in ${location}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 320px, 500px"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#0a1426,#143626)]" />
            )}

            {/* Subtle inner gradient for cover text legibility */}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.20)_0%,transparent_30%,transparent_60%,rgba(0,0,0,0.55)_100%)]" />

            {/* Top-corner monogram */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.32em] text-white/75">
                <span className="h-px w-5 bg-white/45" />
                Zenvana
              </div>
              <div className="rounded-full bg-white/12 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.22em] text-white/80 backdrop-blur">
                Boutique
              </div>
            </div>

            {/* Bottom-corner location stamp */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="text-[9px] font-medium uppercase tracking-[0.32em] text-white/65">
                Rajpur Road
              </div>
              <div className="mt-0.5 font-serif text-base leading-tight text-white/95 sm:text-lg">
                {location}
              </div>
            </div>
          </div>
        </div>

        {/* Editorial title block */}
        <div className="mx-auto mt-10 max-w-3xl text-center sm:mt-14">
          <div className="flex items-center justify-center gap-3 text-[10px] font-medium uppercase tracking-[0.34em] text-white/55">
            <span className="h-px w-7 bg-white/25" />
            A Quieter Way to Stay
            <span className="h-px w-7 bg-white/25" />
          </div>

          <h1 className="mt-5 font-serif text-[clamp(2.5rem,10.5vw,6.25rem)] font-light leading-[0.94] tracking-[-0.045em] text-white">
            {property.publicName}
          </h1>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12.5px] text-white/72 sm:text-[13.5px]">
            <div className="inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-white/55" />
              <span className="tracking-[0.04em]">{location}</span>
            </div>
            {property.primaryPhone && (
              <>
                <span className="inline-block h-1 w-1 rounded-full bg-white/35" />
                <a
                  href={`tel:${property.primaryPhone}`}
                  className="inline-flex items-center gap-2 transition hover:text-white"
                >
                  <Phone className="h-3.5 w-3.5 text-white/55" />
                  <span>{property.primaryPhone}</span>
                </a>
              </>
            )}
          </div>

          <p className="mx-auto mt-7 max-w-xl text-[14.5px] leading-[1.85] text-white/72 sm:text-[15.5px]">
            {property.descriptionShort ??
              `A thoughtfully located Zenvana stay in ${location}, designed for easy arrivals, quiet comfort, and a smoother city stay.`}
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <PlaneButton
              href={
                couponCode
                  ? `/book/${property.slug}?${new URLSearchParams({ couponCode }).toString()}`
                  : `/book/${property.slug}`
              }
              sentLabel="Opening dates"
              className="rounded-full bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(37,99,235,0.6)] transition-colors hover:bg-blue-500"
            >
              <CalendarCheck className="h-4 w-4" />
              Check availability
            </PlaneButton>

            {property.googleMapPlaceUrl ? (
              <a
                href={property.googleMapPlaceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-white/90 backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[0.10]"
              >
                <MapPin className="h-4 w-4" />
                View on map
              </a>
            ) : null}
          </div>
        </div>

        {/* Preview strip — sharp images, editorial caption */}
        {previewImages.length > 0 && (
          <div className="mt-14 pb-14 sm:mt-20 sm:pb-20">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <div className="text-[9.5px] font-medium uppercase tracking-[0.34em] text-white/55">
                  Plate&nbsp;01
                </div>
                <div className="mt-1.5 font-serif text-lg leading-none tracking-[-0.02em] text-white sm:text-xl">
                  Preview the stay
                </div>
              </div>
              <a
                href="#gallery"
                className="group inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-white/70 transition hover:text-white"
              >
                Full gallery
                <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {previewImages.map((img, index) => (
                <a
                  key={`${img.url}-${index}`}
                  href="#gallery"
                  className="group relative overflow-hidden rounded-[0.85rem] border border-white/8 bg-white/[0.04] backdrop-blur-xl"
                >
                  <div className="relative aspect-[1.05/1]">
                    <Image
                      src={img.url}
                      alt={`${property.publicName} preview ${index + 1}`}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-[1.05]"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(0,0,0,0.4)_100%)] opacity-70 transition group-hover:opacity-100" />
                    <div className="absolute bottom-1.5 left-2 text-[9px] font-medium uppercase tracking-[0.28em] text-white/85">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.32em] text-white/40">
              <span className="h-px w-8 bg-white/20" />
              Rooms · spaces · surroundings
              <span className="h-px w-8 bg-white/20" />
            </div>
          </div>
        )}
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  QUICK FACTS — editorial inline stripe                              */
/* ------------------------------------------------------------------ */

function QuickFacts({
  property,
  location,
}: {
  property: Property
  location: string
}) {
  const items = [
    {
      icon: Plane,
      label: 'Airport',
      value: '≈ 45 min',
    },
    {
      icon: Train,
      label: 'Railway',
      value: '20–25 min',
    },
    {
      icon: BedDouble,
      label: 'Room types',
      value: `${property.roomTypes?.length ?? 0}`,
    },
    {
      icon: MapPin,
      label: 'Setting',
      value: location,
    },
  ]

  return (
    <section className="border-b border-border/60 bg-background">
      <Container className="py-6 sm:py-7">
        <div className="grid grid-cols-2 gap-y-5 sm:flex sm:items-stretch sm:justify-between sm:gap-x-4">
          {items.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className={`flex items-center gap-3 sm:flex-1 sm:justify-start sm:px-2 ${index !== items.length - 1
                  ? 'sm:border-r sm:border-border/60'
                  : ''
                  } ${index % 2 === 0 ? 'sm:pl-0' : ''}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card/60 text-foreground/75">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[9.5px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="mt-0.5 truncate font-serif text-base leading-tight tracking-[-0.01em] text-foreground sm:text-[17px]">
                    {item.value}
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

/* ------------------------------------------------------------------ */
/*  ANCHOR NAV                                                         */
/* ------------------------------------------------------------------ */

function QuickAnchorNav({
  hasGallery,
  hasRooms,
  hasMap,
  hasFaqs,
}: {
  hasGallery: boolean
  hasRooms: boolean
  hasMap: boolean
  hasFaqs: boolean
}) {
  const links = [
    { href: '#overview', label: 'Overview', roman: 'I', enabled: true },
    { href: '#gallery', label: 'Gallery', roman: 'II', enabled: hasGallery },
    { href: '#rooms', label: 'Rooms', roman: 'III', enabled: hasRooms },
    { href: '#location', label: 'Location', roman: 'IV', enabled: hasMap },
    { href: '#faqs', label: 'Practical', roman: 'V', enabled: hasFaqs },
  ].filter((item) => item.enabled)

  return (
    <section className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <Container className="overflow-x-auto">
        <nav className="flex min-w-max items-center gap-1.5 py-3 sm:gap-2">
          {links.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-foreground/75 transition hover:border-foreground/40 hover:bg-card hover:text-foreground"
            >
              <span className="font-serif text-[10px] text-muted-foreground transition group-hover:text-foreground">
                {item.roman}
              </span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  CHAPTER HEADER — reusable section opener                           */
/* ------------------------------------------------------------------ */

function ChapterHeader({
  roman,
  eyebrow,
  title,
  lede,
  align = 'left',
}: {
  roman: string
  eyebrow: string
  title: string
  lede?: string
  align?: 'left' | 'center'
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <div
        className={`flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground ${align === 'center' ? 'justify-center' : ''
          }`}
      >
        <span className="font-serif text-base leading-none tracking-normal text-foreground/70">
          {roman}
        </span>
        <span className="h-px w-8 bg-border" />
        <span>{eyebrow}</span>
      </div>
      <h2 className="mt-5 font-serif text-3xl font-light leading-[0.98] tracking-[-0.04em] text-foreground sm:text-4xl lg:text-[2.85rem]">
        {title}
      </h2>
      {lede && (
        <p className="mt-5 text-[15px] leading-[1.85] text-muted-foreground sm:text-base">
          {lede}
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  OVERVIEW                                                           */
/* ------------------------------------------------------------------ */

function OverviewSplitSection({
  property,
  location,
  galleryImages,
}: {
  property: Property
  location: string
  galleryImages: Array<{ url: string }>
}) {
  const collage = galleryImages.slice(0, 4)

  return (
    <section id="overview" className="scroll-mt-28">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-12">
        <div>
          <ChapterHeader
            roman="I"
            eyebrow="The Stay"
            title="Quiet comfort, easy access, and a stay that feels considered from the moment you arrive."
          />

          <p className="mt-6 text-[15px] leading-[1.9] text-muted-foreground sm:text-base">
            {property.descriptionShort ??
              `${property.publicName} offers a calm and practical base in ${location}, with thoughtfully designed rooms, a clear arrival experience, and the kind of stay that lets the city unfold at its own pace.`}
          </p>

          {property.descriptionLong ? (
            <div
              className="prose prose-neutral mt-6 max-w-none text-muted-foreground dark:prose-invert prose-headings:font-serif prose-headings:font-light prose-headings:text-foreground prose-p:leading-[1.9]"
              dangerouslySetInnerHTML={{
                __html: property.descriptionLong.replace(/\n/g, '<br />'),
              }}
            />
          ) : (
            <p className="mt-4 text-[15px] leading-[1.9] text-muted-foreground sm:text-base">
              Whether you are here for a quick city stop, a longer work stay, or a relaxed Dehradun visit,
              the page below lets you explore the property visually before committing to a booking.
            </p>
          )}

          {/* Place orientation — specific, useful, SEO-rich (no filler) */}
          <div className="mt-9 rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
              <Navigation className="h-3.5 w-3.5 text-gold-500" />
              On Rajpur Road
            </div>
            <p className="mt-3 text-sm leading-[1.85] text-foreground/85">
              A short drive from the centre of Dehradun: about 20–25 minutes from the railway
              station and ISBT, roughly 45 minutes from Jolly Grant Airport, and 35–45 minutes up
              to Mussoorie. Exact distances and nearby spots are in{' '}
              <a href="#getting-here" className="underline-gold underline-offset-4 hover:text-foreground">
                Getting here
              </a>
              .
            </p>
          </div>
        </div>

        {/* Asymmetric editorial collage */}
        {collage.length > 0 && (
          <div className="grid grid-cols-6 gap-3 sm:gap-4">
            {/* Large featured tile */}
            {collage[0] && (
              <div className="group relative col-span-6 aspect-[5/4] overflow-hidden rounded-[1.25rem] border border-border/60 bg-card/60 sm:col-span-4 sm:aspect-[4/5]">
                <Image
                  src={collage[0].url}
                  alt={`${property.publicName} gallery image 1`}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(0,0,0,0.3)_100%)]" />
                <div className="absolute bottom-3 left-4 text-[9.5px] font-medium uppercase tracking-[0.3em] text-white/85">
                  Plate 01
                </div>
              </div>
            )}
            {/* Smaller stacked tiles */}
            <div className="col-span-6 grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-1 sm:gap-4">
              {collage.slice(1, 3).map((img, index) => (
                <div
                  key={`${img.url}-${index}`}
                  className="group relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-border/60 bg-card/60 sm:aspect-[4/4]"
                >
                  <Image
                    src={img.url}
                    alt={`${property.publicName} gallery image ${index + 2}`}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 50vw, 22vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(0,0,0,0.25)_100%)]" />
                  <div className="absolute bottom-2 left-2.5 text-[9px] font-medium uppercase tracking-[0.28em] text-white/85">
                    Plate {String(index + 2).padStart(2, '0')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  GALLERY                                                            */
/* ------------------------------------------------------------------ */

function GallerySection({
  propertyName,
  images,
}: {
  propertyName: string
  images: GalleryImage[]
}) {
  return (
    <section id="gallery" className="scroll-mt-28">
      <ChapterHeader
        roman="II"
        eyebrow="Gallery"
        title="See the stay before you arrive."
        lede="Browse the rooms, common spaces, and overall atmosphere to get a clearer sense of the property before you book."
      />

      <div className="mt-10">
        <FilterableGallery images={images} propertyName={propertyName} />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  ROOMS                                                              */
/* ------------------------------------------------------------------ */

function RoomsSection({
  propertySlug,
  roomTypes,
  couponCode,
}: {
  propertySlug: string
  roomTypes: Array<{
    id: string | number
    name: string
    shortDescription?: string | null
    images?: unknown
  }>
  couponCode?: string
}) {
  return (
    <section id="rooms" className="scroll-mt-28">
      <ChapterHeader
        roman="III"
        eyebrow="Rooms"
        title="Rooms that deserve more than a thumbnail."
        lede="Each room type gets proper visual space, so guests can compare the stay experience with confidence rather than guessing from a single cramped image."
      />

      <div className="mt-12 space-y-10 sm:space-y-12">
        {roomTypes.map((rt, index) => {
          const roomImages = normalizeGalleryImages(rt.images)
          const num = String(index + 1).padStart(2, '0')

          return (
            <article key={rt.id} className="group">
              {/* Editorial room header strip */}
              <div className="flex items-baseline justify-between border-b border-border pb-4">
                <div className="flex items-baseline gap-4">
                  <span className="font-serif text-2xl font-light leading-none text-foreground/40 sm:text-3xl">
                    {num}
                  </span>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                      Room type
                    </div>
                    <h3 className="mt-1 font-serif text-2xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
                      {rt.name}
                    </h3>
                  </div>
                </div>
                <div className="hidden text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground sm:block">
                  {roomImages.length > 0 ? `${roomImages.length} photographs` : 'Details'}
                </div>
              </div>

              {/* Image + copy split */}
              <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:gap-8">
                <div className="overflow-hidden rounded-[1.25rem] border border-border/60 bg-card/40">
                  {roomImages.length > 0 ? (
                    <EmblaImageGallery
                      images={roomImages.map((img, idx) => ({
                        url: img.url,
                        alt: `${rt.name} image ${idx + 1}`,
                      }))}
                      aspectClassName="aspect-[16/11]"
                      autoPlay={false}
                      showThumbs={roomImages.length > 1}
                    />
                  ) : (
                    <div className="flex aspect-[16/11] items-center justify-center text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                      Room images coming soon
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between gap-6">
                  <p className="text-[14.5px] leading-[1.9] text-muted-foreground sm:text-[15.5px]">
                    {rt.shortDescription ??
                      `${rt.name} is designed for a comfortable and well-paced stay, with clean proportions, practical comfort, and a calm visual feel.`}
                  </p>

                  <div className="flex flex-col gap-2.5">
                    <Button
                      href={
                        `/book/${propertySlug}?` +
                        new URLSearchParams({
                          room: rt.name,
                          ...(couponCode ? { couponCode } : {}),
                        }).toString()
                      }
                      color="blue"
                      className="flex items-center justify-center gap-2 rounded-full px-6 py-3"
                    >
                      <CalendarCheck className="h-4 w-4" />
                      Check availability
                    </Button>

                    <a
                      href="#gallery"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-[13px] font-medium text-foreground transition hover:bg-muted"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      More photographs
                    </a>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  GETTING HERE — real transit + nearby distances (local SEO)         */
/* ------------------------------------------------------------------ */

function GettingHereSection({ property }: { property: Property }) {
  const { transit, nearby } = placesNear(
    property.latitude,
    property.longitude,
    property.nearbyPlaces,
  )
  if (transit.length === 0 && nearby.length === 0) return null

  return (
    <section id="getting-here" className="scroll-mt-28">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
          <Navigation className="h-3.5 w-3.5 text-gold-500" />
          <span>Getting here</span>
        </div>
        <h2 className="mt-5 font-serif text-3xl font-light leading-[0.98] tracking-[-0.04em] text-foreground sm:text-4xl">
          Close to the station, the airport, and the hills.
        </h2>
        <p className="mt-5 text-[15px] leading-[1.85] text-muted-foreground sm:text-base">
          Distances are straight-line from {property.publicName}; drive times are typical for the
          Rajpur Road corridor and vary with traffic.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div>
          <h3 className="font-serif text-lg font-light tracking-[-0.02em] text-foreground">
            By air, rail &amp; road
          </h3>
          <dl className="mt-4 divide-y divide-border/60">
            {transit.map((p) => (
              <div key={p.name} className="flex items-baseline justify-between gap-4 py-3.5">
                <dt className="min-w-0">
                  <span className="block text-[14.5px] leading-snug text-foreground">{p.name}</span>
                  <span className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {p.category}
                  </span>
                </dt>
                <dd className="shrink-0 text-right">
                  <span className="block font-serif text-[15px] text-foreground">{p.driveTime}</span>
                  <span className="text-[11px] text-muted-foreground">≈ {formatKm(p.km)}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h3 className="font-serif text-lg font-light tracking-[-0.02em] text-foreground">
            Around the corner
          </h3>
          <dl className="mt-4 divide-y divide-border/60">
            {nearby.map((p) => (
              <div key={p.name} className="flex items-baseline justify-between gap-4 py-3.5">
                <dt className="min-w-0">
                  <span className="block text-[14.5px] leading-snug text-foreground">{p.name}</span>
                  <span className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {p.category}
                  </span>
                </dt>
                <dd className="shrink-0 font-serif text-[15px] text-foreground">≈ {formatKm(p.km)}</dd>
              </div>
            ))}
          </dl>
          {property.googleMapPlaceUrl ? (
            <a
              href={property.googleMapPlaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium text-foreground underline-gold underline-offset-4 hover:text-foreground"
            >
              <Navigation className="h-4 w-4" />
              Open in Google Maps
            </a>
          ) : null}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  FAQ — editorial line accordion                                     */
/* ------------------------------------------------------------------ */

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
    <section id="faqs" className="scroll-mt-28">
      <ChapterHeader
        roman="V"
        eyebrow="Practical"
        title="Details worth knowing before you book."
      />

      <div className="mt-10 border-t border-border">
        {faqs.map((faq, index) => (
          <details
            key={faq.id}
            className="group border-b border-border py-5 transition"
          >
            <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 text-left">
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-base font-light text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-serif text-lg font-light leading-snug tracking-[-0.01em] text-foreground sm:text-xl">
                  {faq.question}
                </span>
              </div>
              <span className="mt-1 shrink-0 text-base text-muted-foreground transition group-open:rotate-45 group-open:text-foreground">
                +
              </span>
            </summary>
            <p className="mt-4 max-w-3xl pl-9 text-[14.5px] leading-[1.85] text-muted-foreground sm:text-[15px]">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  BOOKING SIDEBAR                                                    */
/* ------------------------------------------------------------------ */

function BookingSidebar({
  property,
  location,
  totalImageCount,
  couponCode,
}: {
  property: Property
  location: string
  totalImageCount: number
  couponCode?: string
}) {
  const roomCount = property.roomTypes?.length ?? 0

  return (
    <div className="xl:sticky xl:top-24">
      <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/70 shadow-[0_28px_70px_-25px_rgba(8,17,31,0.18)] backdrop-blur-xl dark:bg-card/55">
        <div className="border-b border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)] px-6 py-7 sm:px-7">
          <div className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Book Direct
          </div>

          <h2 className="mt-4 font-serif text-2xl font-light tracking-[-0.03em] text-foreground sm:text-[1.7rem]">
            Stay with confidence
          </h2>

          <p className="mt-3 text-[13.5px] leading-[1.85] text-muted-foreground">
            Explore the property visually, compare rooms properly, and book direct when you are ready.
          </p>
        </div>

        <div className="px-6 py-6 sm:px-7">
          <Button
            href={
              couponCode
                ? `/book/${property.slug}?${new URLSearchParams({ couponCode }).toString()}`
                : `/book/${property.slug}`
            }
            color="blue"
            className="flex w-full items-center justify-center gap-2 rounded-full py-3.5"
          >
            <CalendarCheck className="h-4 w-4" />
            Check availability
          </Button>

          <div className="mt-6 space-y-4 border-t border-border/60 pt-6">
            <SidebarStat icon={Plane} label="Airport" value="≈ 45 min" sub="Jolly Grant (DED)" />
            <SidebarStat icon={BedDouble} label="Room types" value={`${roomCount}`} />
            <SidebarStat icon={MapPin} label="Setting" value={location} sub={property.fullAddress ?? undefined} />
            <SidebarStat icon={ShieldCheck} label="Coordination" value="Direct line" sub="Reach the team easily before arrival." />
          </div>

          {(property.primaryPhone || property.googleMapPlaceUrl) && (
            <div className="mt-6 space-y-4 border-t border-border/60 pt-6">
              {property.primaryPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                      Telephone
                    </div>
                    <a
                      href={`tel:${property.primaryPhone}`}
                      className="mt-1 inline-block font-serif text-base text-foreground hover:underline"
                    >
                      {property.primaryPhone}
                    </a>
                  </div>
                </div>
              )}

              {property.googleMapPlaceUrl && (
                <a
                  href={property.googleMapPlaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.26em] text-foreground transition hover:text-primary"
                >
                  View on map
                  <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SidebarStat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 truncate font-serif text-[15px] leading-tight text-foreground">
          {value}
        </div>
        {sub && (
          <p className="mt-1 text-[12px] leading-[1.7] text-muted-foreground">
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  MOBILE STICKY BOOKING                                              */
/* ------------------------------------------------------------------ */

function PropertyMobileBookingBar({
  property,
  couponCode,
}: {
  property: Property
  couponCode?: string
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/92 px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-xl xl:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        {property.primaryPhone ? (
          <a
            href={`tel:${property.primaryPhone}`}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition hover:bg-muted"
            aria-label="Call property"
          >
            <Phone className="h-4 w-4" />
          </a>
        ) : null}

        <PlaneButton
          href={
            couponCode
              ? `/book/${property.slug}?${new URLSearchParams({ couponCode }).toString()}`
              : `/book/${property.slug}`
          }
          sentLabel="Opening dates"
          className="h-12 flex-1 rounded-full bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          <CalendarCheck className="h-4 w-4" />
          <span className="tracking-[0.02em]">Check availability</span>
        </PlaneButton>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  OTHER PROPERTIES                                                   */
/* ------------------------------------------------------------------ */

function CompareOtherProperties({
  currentName,
  others,
}: {
  currentName: string
  others: Array<{
    slug: string
    publicName: string
    heroImageUrl?: string | null
    city?: string | null
    state?: string | null
    shortDescription?: string | null
  }>
}) {
  return (
    <section className="border-t border-border/60 bg-card/30">
      <Container className="py-14 sm:py-18 lg:py-22">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
              <span className="font-serif text-base leading-none tracking-normal text-foreground/70">
                VI
              </span>
              <span className="h-px w-8 bg-border" />
              <span>The Collection</span>
            </div>
            <h2 className="mt-5 font-serif text-3xl font-light leading-[0.98] tracking-[-0.04em] text-foreground sm:text-4xl lg:text-[2.85rem]">
              Same road, different mood.
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-[1.85] text-muted-foreground">
              Seven hotels on the same Rajpur Road. Each with its own character — pick the
              one that matches the mood of your trip.
            </p>
          </div>
          <Link
            href="/hotels"
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-foreground transition hover:bg-muted"
          >
            All hotels
            <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="-mx-4 mt-10 flex gap-4 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {others.map((p, index) => {
            const location = [p.city, p.state].filter(Boolean).join(', ')
            return (
              <Link
                key={p.slug}
                href={`/hotels/${p.slug}`}
                className="group relative min-w-[260px] max-w-[320px] flex-1 snap-start overflow-hidden rounded-[1.25rem] border border-border/60 bg-card/80 transition duration-500 ease-out hover:-translate-y-1 hover:border-foreground/30 hover:shadow-[0_20px_50px_-15px_rgba(8,17,31,0.15)] sm:min-w-0 sm:max-w-none dark:bg-card/60"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  {p.heroImageUrl ? (
                    <Image
                      src={p.heroImageUrl}
                      alt={`${p.publicName} by Zenvana`}
                      fill
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 25vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.06]"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.55)_100%)]" />
                  <div className="absolute top-3 left-3 text-[9.5px] font-medium uppercase tracking-[0.3em] text-white/85">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="font-serif text-xl font-light tracking-[-0.02em] text-white sm:text-2xl">
                      {p.publicName}
                    </div>
                    {location && (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/75">
                        <MapPin className="h-3 w-3" />
                        {location}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  {p.shortDescription && (
                    <p className="line-clamp-2 text-[13px] leading-[1.7] text-muted-foreground">
                      {p.shortDescription}
                    </p>
                  )}
                  <div className="mt-4 inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.28em] text-foreground transition group-hover:translate-x-0.5">
                    Explore
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </Container>
    </section>
  )
}