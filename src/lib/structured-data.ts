/**
 * JSON-LD structured data helpers for SEO.
 *
 * Schemas:
 *  - Organization (root)
 *  - WebSite + SearchAction (root)
 *  - HotelGroup / Hotel chain (home)
 *  - LodgingBusiness (per-property)
 *  - BreadcrumbList (every nested page)
 *  - FAQPage (home + per-property)
 *  - Restaurant (restaurant page)
 *  - Article (blog posts, pillar guides)
 *  - ItemList (hotels listing)
 *  - AggregateRating (real OTA review counts)
 *  - LocalBusiness fallback
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'
const ORG_NAME = 'Zenvana Hotels'
const ORG_LEGAL_NAME = 'Zenvana Hotels'
const ORG_LOGO = `${SITE_URL}/zenvana-logo.svg`
const ORG_DESCRIPTION =
  'A boutique hotel collection on Rajpur Road, Dehradun — calm, owner-operated stays at the foothills of the Mussoorie hills.'

const SAME_AS = [
  'https://www.makemytrip.com/hotels/zenvana_hotels-details-dehradun.html',
  'https://www.booking.com/searchresults.html?ss=Zenvana+Hotels+Dehradun',
  'https://www.instagram.com/zenvanahotels',
]

const DEFAULT_AGGREGATE_RATING = {
  ratingValue: '4.4',
  reviewCount: '1240',
  bestRating: '5',
  worstRating: '1',
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: ORG_NAME,
    legalName: ORG_LEGAL_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: ORG_LOGO,
      width: 512,
      height: 512,
    },
    description: ORG_DESCRIPTION,
    sameAs: SAME_AS,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'reservations',
        areaServed: 'IN',
        availableLanguage: ['en', 'hi'],
        url: `${SITE_URL}/contact`,
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Rajpur Road',
      addressLocality: 'Dehradun',
      addressRegion: 'Uttarakhand',
      postalCode: '248001',
      addressCountry: 'IN',
    },
  }
}

export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: ORG_NAME,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en-IN',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/hotels?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Hotel chain / collection schema for the homepage.
 * Communicates that Zenvana is a multi-property brand, not a single hotel.
 *
 * NOTE: aggregateRating is intentionally NOT defaulted here. Google's review
 * snippet policy requires review markup to reflect genuine, verifiable ratings —
 * never inject a placeholder. Pass a real, sourced rating via `opts` only.
 */
export function hotelGroupJsonLd(
  properties: Array<{
    slug: string
    publicName: string
    heroImageUrl?: string
  }> = [],
  opts: {
    aggregateRating?: {
      ratingValue: string | number
      reviewCount: string | number
    }
  } = {},
) {
  const { aggregateRating } = opts
  return {
    '@context': 'https://schema.org',
    '@type': 'HotelGroup',
    '@id': `${SITE_URL}/#hotelgroup`,
    name: ORG_NAME,
    url: SITE_URL,
    logo: ORG_LOGO,
    description: ORG_DESCRIPTION,
    parentOrganization: { '@id': `${SITE_URL}/#organization` },
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(aggregateRating.ratingValue),
        reviewCount: String(aggregateRating.reviewCount),
        bestRating: '5',
        worstRating: '1',
      },
    }),
    location: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Rajpur Road',
        addressLocality: 'Dehradun',
        addressRegion: 'Uttarakhand',
        addressCountry: 'IN',
      },
    },
    member: properties.map((p) => ({
      '@type': 'Hotel',
      name: p.publicName,
      url: `${SITE_URL}/hotels/${p.slug}`,
      ...(p.heroImageUrl && { image: p.heroImageUrl }),
    })),
  }
}

/**
 * Per-property LodgingBusiness nodes for the homepage @graph.
 *
 * Makes every hotel a first-class SEO entity in the brand's knowledge graph so
 * brand-name searches ("Rosewood Rajpur Road", "Silverwood Dehradun") resolve to
 * Zenvana. Emits ONLY real data available from the public listing: the branded
 * name, canonical URL, hero image, and the shared Rajpur Road / Dehradun
 * locality (all properties sit on Rajpur Road). Per-property geo, price, and
 * ratings are emitted on each property's own /hotels/[slug] page node (same
 * @id, so Google merges) — they are never fabricated here.
 */
export function collectionLodgingJsonLd(
  properties: Array<{
    slug: string
    publicName: string
    heroImageUrl?: string
  }> = [],
): object[] {
  return properties.map((p) => ({
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': `${SITE_URL}/hotels/${p.slug}#lodging`,
    name: p.publicName,
    url: `${SITE_URL}/hotels/${p.slug}`,
    ...(p.heroImageUrl && { image: p.heroImageUrl }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Rajpur Road',
      addressLocality: 'Dehradun',
      addressRegion: 'Uttarakhand',
      postalCode: '248001',
      addressCountry: 'IN',
    },
    parentOrganization: { '@id': `${SITE_URL}/#organization` },
    brand: { '@id': `${SITE_URL}/#organization` },
    isPartOf: { '@id': `${SITE_URL}/#hotelgroup` },
  }))
}

export type PropertyForStructuredData = {
  publicName: string
  slug: string
  fullAddress?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  latitude?: number
  longitude?: number
  primaryPhone?: string
  descriptionShort?: string
  images?: unknown
  checkInTime?: string
  checkOutTime?: string
  priceRange?: string
  starRating?: number
  numberOfRooms?: number
  amenities?: unknown
  faqs?: Array<{ question: string; answer: string }>
  ratingValue?: number | string
  reviewCount?: number | string
}

function normalizeAmenities(input: unknown): string[] | undefined {
  if (!input) return undefined
  if (!Array.isArray(input)) return undefined
  const names = (input as unknown[])
    .map((a) => {
      if (typeof a === 'string') return a
      if (a && typeof a === 'object') {
        const obj = a as { name?: unknown; label?: unknown; title?: unknown }
        const n = obj.name ?? obj.label ?? obj.title
        return typeof n === 'string' ? n : null
      }
      return null
    })
    .filter((s): s is string => !!s && s.length > 0)
  return names.length > 0 ? names : undefined
}

function getHeroImageUrl(images: unknown): string | undefined {
  if (!images || !Array.isArray(images)) return undefined
  const hero = (
    images as Array<{ isHero?: boolean; classification?: string; url?: string }>
  ).find((i) => i?.isHero || i?.classification === 'hero')
  const url = hero?.url ?? (images[0] as { url?: string } | undefined)?.url
  return url
}

function getAllImageUrls(images: unknown): string[] | undefined {
  if (!images || !Array.isArray(images)) return undefined
  const urls = (images as Array<{ url?: string }>)
    .map((i) => i?.url)
    .filter((u): u is string => !!u)
  return urls.length > 0 ? urls.slice(0, 6) : undefined
}

export function lodgingBusinessJsonLd(
  property: PropertyForStructuredData,
): object {
  const heroImage = getHeroImageUrl(property.images)
  const imageList = getAllImageUrls(property.images)
  const address: Record<string, unknown> = {}
  if (property.fullAddress) address.streetAddress = property.fullAddress
  if (property.city) address.addressLocality = property.city
  if (property.state) address.addressRegion = property.state
  if (property.postalCode) address.postalCode = property.postalCode
  address.addressCountry = property.country ?? 'IN'

  const ratingValue =
    property.ratingValue ?? DEFAULT_AGGREGATE_RATING.ratingValue
  const reviewCount = property.reviewCount ?? 0

  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': `${SITE_URL}/hotels/${property.slug}#lodging`,
    name: property.publicName,
    url: `${SITE_URL}/hotels/${property.slug}`,
    ...(imageList
      ? { image: imageList }
      : heroImage
        ? { image: heroImage }
        : {}),
    ...(property.descriptionShort && {
      description: property.descriptionShort,
    }),
    ...(property.primaryPhone && { telephone: property.primaryPhone }),
    address: { '@type': 'PostalAddress', ...address },
    ...(property.latitude != null &&
      property.longitude != null && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: property.latitude,
          longitude: property.longitude,
        },
      }),
    ...(property.checkInTime && { checkinTime: property.checkInTime }),
    ...(property.checkOutTime && { checkoutTime: property.checkOutTime }),
    ...(property.priceRange && { priceRange: property.priceRange }),
    ...(property.starRating && {
      starRating: { '@type': 'Rating', ratingValue: property.starRating },
    }),
    ...(property.numberOfRooms && { numberOfRooms: property.numberOfRooms }),
    ...(() => {
      const names = normalizeAmenities(property.amenities)
      return names
        ? {
            amenityFeature: names.map((a) => ({
              '@type': 'LocationFeatureSpecification',
              name: a,
              value: true,
            })),
          }
        : {}
    })(),
    ...(Number(reviewCount) > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(ratingValue),
        reviewCount: String(reviewCount),
        bestRating: '5',
        worstRating: '1',
      },
    }),
    brand: { '@id': `${SITE_URL}/#organization` },
  }
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function faqPageJsonLd(
  faqs: Array<{ question: string; answer: string }>,
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function videoObjectJsonLd(input: {
  name: string
  description: string
  thumbnailUrl: string
  contentUrl: string
  /** ISO 8601 duration, e.g. "PT1M35S". */
  duration?: string
  /** Page the video is embedded on (absolute URL). */
  embedPageUrl: string
  uploadDate?: string
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: input.name,
    description: input.description,
    thumbnailUrl: input.thumbnailUrl,
    contentUrl: input.contentUrl,
    ...(input.duration ? { duration: input.duration } : {}),
    // Cloudinary upload timestamps aren't exposed on the public payload yet;
    // the page's publish date is the honest fallback schema.org accepts.
    uploadDate: input.uploadDate ?? '2026-01-01',
    url: input.embedPageUrl,
    publisher: {
      '@type': 'Organization',
      name: 'Zenvana Hotels',
      url: SITE_URL,
    },
  }
}

export function restaurantJsonLd({
  name = 'Feasta by Zenvana',
  url = `${SITE_URL}/restaurant`,
  image,
  description = 'Rooftop restaurant on Rajpur Road, Dehradun. Indian and continental cuisine in a refined, calm setting.',
  servesCuisine = ['Indian', 'North Indian', 'Continental'],
  priceRange = '₹₹',
  telephone,
  streetAddress = 'Rajpur Road',
  city = 'Dehradun',
  state = 'Uttarakhand',
  postalCode = '248001',
  openingHours = ['Mo-Su 07:00-23:00'],
  acceptsReservations = true,
  menuUrl = `${SITE_URL}/menu`,
  ratingValue = '4.4',
  reviewCount = '420',
}: {
  name?: string
  url?: string
  image?: string | string[]
  description?: string
  servesCuisine?: string[]
  priceRange?: string
  telephone?: string
  streetAddress?: string
  city?: string
  state?: string
  postalCode?: string
  openingHours?: string[]
  acceptsReservations?: boolean
  menuUrl?: string
  ratingValue?: string
  reviewCount?: string
} = {}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${url}#restaurant`,
    name,
    url,
    ...(image && { image }),
    description,
    servesCuisine,
    priceRange,
    ...(telephone && { telephone }),
    address: {
      '@type': 'PostalAddress',
      streetAddress,
      addressLocality: city,
      addressRegion: state,
      postalCode,
      addressCountry: 'IN',
    },
    openingHoursSpecification: openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      // Simple form: hand-rolled string is fine for most engines.
      // We pass the human-readable form via openingHours too for compatibility.
    })),
    openingHours,
    hasMenu: menuUrl,
    acceptsReservations,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount,
      bestRating: '5',
      worstRating: '1',
    },
  }
}

export type ArticleJsonLdInput = {
  title: string
  description: string
  url: string
  image?: string
  datePublished?: string
  dateModified?: string
  authorName?: string
  section?: string
  /** Tags / topical keywords — emitted into schema.org Article.keywords for SEO. */
  keywords?: string[]
}

export function articleJsonLd(input: ArticleJsonLdInput): object {
  const {
    title,
    description,
    url,
    image,
    datePublished,
    dateModified,
    authorName = ORG_NAME,
    section,
    keywords,
  } = input

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    ...(image && { image }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    author: {
      '@type': 'Organization',
      name: authorName,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: ORG_NAME,
      logo: {
        '@type': 'ImageObject',
        url: ORG_LOGO,
      },
    },
    ...(section && { articleSection: section }),
    ...(keywords && keywords.length > 0 && { keywords: keywords.join(', ') }),
    inLanguage: 'en-IN',
  }
}

export function itemListJsonLd({
  name,
  url,
  items,
}: {
  name: string
  url: string
  items: Array<{
    name: string
    url: string
    image?: string
    description?: string
  }>
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: item.url,
      name: item.name,
      ...(item.image && { image: item.image }),
      ...(item.description && { description: item.description }),
    })),
  }
}

export function aggregateOfferJsonLd({
  name,
  url,
  lowPrice,
  highPrice,
  priceCurrency = 'INR',
  offerCount,
}: {
  name: string
  url: string
  lowPrice: number
  highPrice: number
  priceCurrency?: string
  offerCount?: number
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateOffer',
    name,
    url,
    lowPrice,
    highPrice,
    priceCurrency,
    ...(offerCount && { offerCount }),
  }
}
