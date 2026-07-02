import { BlogPostStatus, type BlogMedia, type BlogPost } from '@prisma/client'

import { getBlogSlugRedirectTarget } from '@/lib/blogRedirects'
import { prisma } from '@/lib/prisma'

export type BlogPostWithMedia = BlogPost & { media: BlogMedia[] }

const publishedWhere = {
  status: BlogPostStatus.PUBLISHED,
} as const

export function isBlogDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}

export async function getPublishedBlogPosts(): Promise<BlogPostWithMedia[]> {
  return prisma.blogPost.findMany({
    where: publishedWhere,
    include: { media: { orderBy: { sortOrder: 'asc' } } },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function getPublishedBlogPostBySlug(
  slug: string,
): Promise<BlogPostWithMedia | null> {
  return prisma.blogPost.findFirst({
    where: {
      slug,
      status: BlogPostStatus.PUBLISHED,
      alternateHref: null,
    },
    include: { media: { orderBy: { sortOrder: 'asc' } } },
  })
}

/** Published post by slug, including posts that use a custom public path via alternateHref. */
export async function getPublishedBlogPostBySlugIncludingAlternate(
  slug: string,
): Promise<BlogPostWithMedia | null> {
  return prisma.blogPost.findFirst({
    where: {
      slug,
      status: BlogPostStatus.PUBLISHED,
    },
    include: { media: { orderBy: { sortOrder: 'asc' } } },
  })
}

export type BlogPostRouteResolution =
  | { kind: 'render'; post: BlogPostWithMedia }
  | { kind: 'redirect'; destination: string }
  | { kind: 'missing' }

/**
 * Resolves how /blog/[slug] should behave: render CMS post, redirect (slug change or alternateHref), or 404.
 */
export async function resolveBlogPostRoute(slug: string): Promise<BlogPostRouteResolution> {
  const redirectSlug = await getBlogSlugRedirectTarget(slug)
  const lookupSlug = redirectSlug ?? slug

  const post = await getPublishedBlogPostBySlug(lookupSlug)
  if (post) {
    if (redirectSlug && redirectSlug !== lookupSlug) {
      return { kind: 'redirect', destination: getBlogPostHref(post) }
    }
    return { kind: 'render', post }
  }

  const alternatePost = await getPublishedBlogPostBySlugIncludingAlternate(lookupSlug)
  if (alternatePost?.alternateHref) {
    return { kind: 'redirect', destination: alternatePost.alternateHref }
  }

  return { kind: 'missing' }
}

export async function getAllPublishedBlogSlugs(): Promise<string[]> {
  const posts = await prisma.blogPost.findMany({
    where: {
      ...publishedWhere,
      alternateHref: null,
    },
    select: { slug: true },
    orderBy: { slug: 'asc' },
  })
  return posts.map((post) => post.slug)
}

/** Safe for build-time static param generation when DATABASE_URL may be unavailable. */
export async function getAllPublishedBlogSlugsForBuild(): Promise<string[]> {
  if (!isBlogDatabaseConfigured()) return []
  try {
    return await getAllPublishedBlogSlugs()
  } catch {
    return []
  }
}

export async function getIndexablePublishedBlogSlugs(): Promise<string[]> {
  const entries = await getIndexablePublishedBlogSitemapEntries()
  return entries.map((entry) => entry.slug)
}

export type BlogSitemapEntry = {
  slug: string
  lastModified: Date
}

export async function getIndexablePublishedBlogSitemapEntries(): Promise<BlogSitemapEntry[]> {
  const posts = await prisma.blogPost.findMany({
    where: {
      ...publishedWhere,
      isIndexable: true,
      alternateHref: null,
    },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })
  return posts.map((post) => ({
    slug: post.slug,
    lastModified: post.updatedAt,
  }))
}

export function getBlogPostHref(post: Pick<BlogPost, 'slug' | 'alternateHref'>): string {
  return post.alternateHref ?? `/blog/${post.slug}`
}

export function resolveBlogCanonicalPath(
  post: Pick<BlogPost, 'slug' | 'canonicalUrl' | 'alternateHref'>,
): string {
  if (post.canonicalUrl) {
    try {
      const url = new URL(post.canonicalUrl)
      return url.pathname
    } catch {
      return post.canonicalUrl.startsWith('/') ? post.canonicalUrl : `/${post.canonicalUrl}`
    }
  }
  return getBlogPostHref(post)
}
