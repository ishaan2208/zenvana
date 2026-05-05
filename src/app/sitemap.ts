import { MetadataRoute } from 'next'
import { getPublicProperties } from '@/lib/api'
import { getAllBlogSlugs } from '@/lib/blogPosts'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const [properties, blogSlugs] = await Promise.all([
    getPublicProperties(),
    Promise.resolve(getAllBlogSlugs()),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/hotels`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/best-hotel-in-dehradun`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/restaurant`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/offers`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/privacypolicy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const propertyPages: MetadataRoute.Sitemap = properties.map((p) => ({
    url: `${SITE_URL}/hotels/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...propertyPages, ...blogPages]
}
