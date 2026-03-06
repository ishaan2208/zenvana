/**
 * JSON-LD structured data for SEO (Organization, WebSite, Hotel, Breadcrumb, FAQ).
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvana.com'

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Zenvana Hotels',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      'Boutique and family-friendly hotel stays. Book direct for the best rates.',
  }
}

export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Zenvana Hotels',
    url: SITE_URL,
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

export type PropertyForStructuredData = {
  publicName: string
  slug: string
  fullAddress?: string
  city?: string
  state?: string
  country?: string
  latitude?: number
  longitude?: number
  primaryPhone?: string
  descriptionShort?: string
  images?: unknown
  checkInTime?: string
  checkOutTime?: string
  faqs?: Array<{ question: string; answer: string }>
}

function getHeroImageUrl(images: unknown): string | undefined {
  if (!images || !Array.isArray(images)) return undefined
  const hero = (images as Array<{ isHero?: boolean; classification?: string; url?: string }>).find(
    (i) => i?.isHero || i?.classification === 'hero'
  )
  const url = hero?.url ?? (images[0] as { url?: string } | undefined)?.url
  return url
}

export function lodgingBusinessJsonLd(
  property: PropertyForStructuredData
): object {
  const image = getHeroImageUrl(property.images)
  const address: Record<string, unknown> = {}
  if (property.fullAddress) address.streetAddress = property.fullAddress
  if (property.city) address.addressLocality = property.city
  if (property.state) address.addressRegion = property.state
  if (property.country) address.addressCountry = property.country

  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: property.publicName,
    url: `${SITE_URL}/hotels/${property.slug}`,
    ...(image && { image }),
    ...(property.descriptionShort && { description: property.descriptionShort }),
    ...(property.primaryPhone && { telephone: property.primaryPhone }),
    ...(Object.keys(address).length > 0 && { address: { '@type': 'PostalAddress', ...address } }),
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
  }
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
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
  faqs: Array<{ question: string; answer: string }>
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
