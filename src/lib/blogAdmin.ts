import {
  BlogMediaRole,
  BlogMediaType,
  BlogPostStatus,
  type BlogMedia,
  type BlogPost,
} from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { getBlogPostHref } from '@/lib/blog'
import { recordBlogSlugRedirect } from '@/lib/blogRedirects'
import { prisma } from '@/lib/prisma'
import { sanitizeBlogHtml } from '@/lib/sanitizeHtml'

export type BlogPostAdminRecord = BlogPost & { media: BlogMedia[] }

export type BlogPostInput = {
  slug: string
  title: string
  excerpt: string
  contentHtml: string
  alternateHref?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string[]
  canonicalUrl?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImageUrl?: string | null
  twitterTitle?: string | null
  twitterDescription?: string | null
  twitterImageUrl?: string | null
  heroImageUrl?: string | null
  authorName?: string | null
  status?: BlogPostStatus
  isIndexable?: boolean
}

function normalizeSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function sanitizeBlogAlternateHref(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (!trimmed.startsWith('/')) {
    throw new Error('Alternate href must start with / (e.g. /best-hotel-in-dehradun)')
  }
  if (/\s/.test(trimmed)) {
    throw new Error('Alternate href cannot contain spaces. Use hyphens instead (e.g. /hotels-in-dehradun)')
  }
  return trimmed
}

function sanitizeBlogCanonicalUrl(
  value: string | null | undefined,
  slug: string,
): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      new URL(trimmed)
      return trimmed
    } catch {
      throw new Error('Canonical URL is not a valid URL')
    }
  }
  if (!trimmed.startsWith('/')) {
    throw new Error('Canonical URL must be an absolute path (/) or full URL (https://…)')
  }
  if (/\s/.test(trimmed)) {
    throw new Error(`Canonical URL cannot contain spaces. Did you mean /blog/${slug}?`)
  }
  return trimmed
}

function revalidateBlogPaths(post: Pick<BlogPost, 'slug' | 'alternateHref'>, previousSlug?: string) {
  revalidatePath('/blog')
  revalidatePath(`/blog/${post.slug}`)
  if (previousSlug && previousSlug !== post.slug) {
    revalidatePath(`/blog/${previousSlug}`)
  }
  if (post.alternateHref) {
    revalidatePath(post.alternateHref)
  }
}

export async function listAllBlogPostsAdmin(): Promise<BlogPostAdminRecord[]> {
  return prisma.blogPost.findMany({
    include: { media: { orderBy: { sortOrder: 'asc' } } },
    orderBy: [{ updatedAt: 'desc' }],
  })
}

export async function getBlogPostAdminById(id: string): Promise<BlogPostAdminRecord | null> {
  return prisma.blogPost.findUnique({
    where: { id },
    include: { media: { orderBy: { sortOrder: 'asc' } } },
  })
}

export async function createBlogPostAdmin(input: BlogPostInput): Promise<BlogPostAdminRecord> {
  const slug = normalizeSlug(input.slug)
  const alternateHref = sanitizeBlogAlternateHref(input.alternateHref)
  const canonicalUrl = sanitizeBlogCanonicalUrl(input.canonicalUrl, slug)
  const status = input.status ?? BlogPostStatus.DRAFT
  const post = await prisma.blogPost.create({
    data: {
      slug,
      title: input.title.trim(),
      excerpt: input.excerpt.trim(),
      contentHtml: sanitizeBlogHtml(input.contentHtml),
      alternateHref,
      seoTitle: input.seoTitle?.trim() || input.title.trim(),
      seoDescription: input.seoDescription?.trim() || input.excerpt.trim(),
      seoKeywords: input.seoKeywords ?? [],
      canonicalUrl,
      ogTitle: input.ogTitle?.trim() || null,
      ogDescription: input.ogDescription?.trim() || null,
      ogImageUrl: input.ogImageUrl?.trim() || null,
      twitterTitle: input.twitterTitle?.trim() || null,
      twitterDescription: input.twitterDescription?.trim() || null,
      twitterImageUrl: input.twitterImageUrl?.trim() || null,
      heroImageUrl: input.heroImageUrl?.trim() || null,
      authorName: input.authorName?.trim() || 'Zenvana Hotels',
      status,
      publishedAt: status === BlogPostStatus.PUBLISHED ? new Date() : null,
      isIndexable: input.isIndexable ?? false,
    },
    include: { media: true },
  })

  revalidateBlogPaths(post)
  return post
}

export async function updateBlogPostAdmin(
  id: string,
  input: BlogPostInput,
): Promise<BlogPostAdminRecord> {
  const existing = await prisma.blogPost.findUnique({ where: { id } })
  if (!existing) {
    throw new Error('Blog post not found')
  }

  const status = input.status ?? existing.status
  const newSlug = normalizeSlug(input.slug)
  const alternateHref = sanitizeBlogAlternateHref(input.alternateHref)
  const canonicalUrl = sanitizeBlogCanonicalUrl(input.canonicalUrl, newSlug)
  const publishedAt =
    status === BlogPostStatus.PUBLISHED
      ? existing.publishedAt ?? new Date()
      : existing.publishedAt

  if (existing.publishedAt && existing.slug !== newSlug) {
    await recordBlogSlugRedirect(existing.slug, newSlug)
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      slug: newSlug,
      title: input.title.trim(),
      excerpt: input.excerpt.trim(),
      contentHtml: sanitizeBlogHtml(input.contentHtml),
      alternateHref,
      seoTitle: input.seoTitle?.trim() || input.title.trim(),
      seoDescription: input.seoDescription?.trim() || input.excerpt.trim(),
      seoKeywords: input.seoKeywords ?? [],
      canonicalUrl,
      ogTitle: input.ogTitle?.trim() || null,
      ogDescription: input.ogDescription?.trim() || null,
      ogImageUrl: input.ogImageUrl?.trim() || null,
      twitterTitle: input.twitterTitle?.trim() || null,
      twitterDescription: input.twitterDescription?.trim() || null,
      twitterImageUrl: input.twitterImageUrl?.trim() || null,
      heroImageUrl: input.heroImageUrl?.trim() || null,
      authorName: input.authorName?.trim() || existing.authorName,
      status,
      publishedAt,
      isIndexable: input.isIndexable ?? false,
    },
    include: { media: { orderBy: { sortOrder: 'asc' } } },
  })

  revalidateBlogPaths(existing, existing.slug)
  revalidateBlogPaths(post, existing.slug)
  return post
}

export async function deleteBlogPostAdmin(id: string): Promise<void> {
  const existing = await prisma.blogPost.findUnique({ where: { id } })
  if (!existing) return

  await prisma.blogPost.delete({ where: { id } })
  revalidateBlogPaths(existing)
}

export async function addBlogMediaAdmin(input: {
  blogPostId: string
  type: BlogMediaType
  role?: BlogMediaRole
  url: string
  publicId?: string | null
  width?: number | null
  height?: number | null
  duration?: number | null
  bytes?: number | null
  format?: string | null
  altText?: string | null
  sortOrder?: number
}): Promise<BlogMedia> {
  const role = input.role ?? BlogMediaRole.GALLERY

  // Enforce singletons for HERO_DESKTOP / HERO_MOBILE / THUMBNAIL / OG:
  // only one of each role per post. Drop the previous one if the writer
  // is replacing it (matches the editor's mental model of "one slot, one image").
  const SINGLETON_ROLES: BlogMediaRole[] = [
    BlogMediaRole.HERO_DESKTOP,
    BlogMediaRole.HERO_MOBILE,
    BlogMediaRole.THUMBNAIL,
    BlogMediaRole.OG,
  ]
  if (SINGLETON_ROLES.includes(role)) {
    await prisma.blogMedia.deleteMany({
      where: { blogPostId: input.blogPostId, role },
    })
  }

  const media = await prisma.blogMedia.create({
    data: {
      blogPostId: input.blogPostId,
      type: input.type,
      role,
      url: input.url,
      publicId: input.publicId ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      duration: input.duration ?? null,
      bytes: input.bytes ?? null,
      format: input.format ?? null,
      altText: input.altText ?? null,
      sortOrder: input.sortOrder ?? 0,
    },
  })

  // Mirror role-tagged uploads onto the BlogPost convenience columns so the
  // existing rendering (heroImageUrl / ogImageUrl) keeps working everywhere.
  if (role === BlogMediaRole.HERO_DESKTOP) {
    await prisma.blogPost.update({
      where: { id: input.blogPostId },
      data: { heroImageUrl: input.url },
    })
  }
  if (role === BlogMediaRole.OG) {
    await prisma.blogPost.update({
      where: { id: input.blogPostId },
      data: { ogImageUrl: input.url },
    })
  }

  const post = await prisma.blogPost.findUnique({ where: { id: input.blogPostId } })
  if (post) revalidateBlogPaths(post)
  return media
}

export async function deleteBlogMediaAdmin(id: string): Promise<void> {
  const media = await prisma.blogMedia.findUnique({
    where: { id },
    include: { blogPost: true },
  })
  if (!media) return

  await prisma.blogMedia.delete({ where: { id } })

  // If the deleted media was wired into BlogPost.heroImageUrl or ogImageUrl,
  // clear that mirror so the public site doesn't render a dead URL.
  if (media.role === BlogMediaRole.HERO_DESKTOP && media.blogPost.heroImageUrl === media.url) {
    await prisma.blogPost.update({
      where: { id: media.blogPostId },
      data: { heroImageUrl: null },
    })
  }
  if (media.role === BlogMediaRole.OG && media.blogPost.ogImageUrl === media.url) {
    await prisma.blogPost.update({
      where: { id: media.blogPostId },
      data: { ogImageUrl: null },
    })
  }

  revalidateBlogPaths(media.blogPost)
}

export async function updateBlogMediaAltAdmin(
  mediaId: string,
  altText: string,
): Promise<BlogMedia> {
  const media = await prisma.blogMedia.update({
    where: { id: mediaId },
    data: { altText: altText.trim() || null },
  })
  const post = await prisma.blogPost.findUnique({ where: { id: media.blogPostId } })
  if (post) revalidateBlogPaths(post)
  return media
}

export async function setBlogHeroFromMediaAdmin(
  blogPostId: string,
  mediaId: string,
): Promise<BlogPostAdminRecord> {
  const media = await prisma.blogMedia.findFirst({
    where: { id: mediaId, blogPostId },
  })
  if (!media) {
    throw new Error('Media not found for this post')
  }

  const post = await prisma.blogPost.update({
    where: { id: blogPostId },
    data: {
      heroImageUrl: media.url,
      ogImageUrl: media.type === 'IMAGE' ? media.url : undefined,
    },
    include: { media: { orderBy: { sortOrder: 'asc' } } },
  })

  revalidateBlogPaths(post)
  return post
}

export { getBlogPostHref, normalizeSlug }
