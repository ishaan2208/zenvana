import { BlogPostStatus, type BlogMedia, type BlogPost } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export type BlogPostWithMedia = BlogPost & { media: BlogMedia[] }

const publishedWhere = {
  status: BlogPostStatus.PUBLISHED,
} as const

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

export function resolveBlogCanonicalPath(post: Pick<BlogPost, 'slug' | 'canonicalUrl'>): string {
  if (post.canonicalUrl) {
    try {
      const url = new URL(post.canonicalUrl)
      return url.pathname
    } catch {
      return post.canonicalUrl.startsWith('/') ? post.canonicalUrl : `/${post.canonicalUrl}`
    }
  }
  return `/blog/${post.slug}`
}
