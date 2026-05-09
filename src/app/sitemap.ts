import { MetadataRoute } from 'next'
import { getPublicProperties } from '@/lib/api'
import { getAllBlogSlugs } from '@/lib/blogPosts'
import { getAllLandmarks } from '@/lib/landmarks'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const [properties, blogSlugs, landmarks] = await Promise.all([
    getPublicProperties().catch(() => []),
    Promise.resolve(getAllBlogSlugs()),
    getAllLandmarks().catch(() => []),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/hotels`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${SITE_URL}/best-hotel-in-dehradun`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/the-zenvana-difference`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/stay-direct`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${SITE_URL}/weddings`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${SITE_URL}/mussoorie`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/restaurant`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/menu`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/offers`, lastModified: now, changeFrequency: 'daily', priority: 0.85 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/software-solutions`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacypolicy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const propertyPages: MetadataRoute.Sitemap = properties.map((p) => ({
    url: `${SITE_URL}/hotels/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.95,
    ...(p.heroImageUrl && {
      images: [p.heroImageUrl],
    }),
  }))

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const landmarkPages: MetadataRoute.Sitemap = landmarks.map((l) => ({
    url: `${SITE_URL}/hotels-near/${l.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...propertyPages, ...blogPages, ...landmarkPages]
}
