import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://zenvanahotels.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/book/', '/booking/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
