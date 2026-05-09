import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/api/',
          '/book/*/checkout',
          '/book/*/confirmation',
          '/booking/confirmation',
          '/login',
          '/register',
          '/guest/signup',
          '/account',
          '/my-bookings',
          '/*?couponCode=*',
          '/*?utm_*',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/'],
        disallow: ['/book/', '/booking/', '/account', '/my-bookings'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
