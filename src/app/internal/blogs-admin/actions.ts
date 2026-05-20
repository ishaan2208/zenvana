'use server'

import { BlogMediaRole, BlogMediaType, BlogPostStatus } from '@prisma/client'
import { cookies } from 'next/headers'

import { isBlogImageRole } from '@/lib/blogImageSpecs'

import {
  addBlogMediaAdmin,
  createBlogPostAdmin,
  deleteBlogMediaAdmin,
  deleteBlogPostAdmin,
  setBlogHeroFromMediaAdmin,
  updateBlogMediaAltAdmin,
  updateBlogPostAdmin,
} from '@/lib/blogAdmin'
import {
  BLOG_ADMIN_COOKIE,
  BLOG_ADMIN_PASSWORD,
  getBlogAdminSession,
} from '@/lib/blogAdminAuth'

async function requireAdmin() {
  const authorized = await getBlogAdminSession()
  if (!authorized) {
    throw new Error('Unauthorized')
  }
}

export async function loginBlogAdmin(password: string): Promise<{ ok: boolean; error?: string }> {
  if (password !== BLOG_ADMIN_PASSWORD) {
    return { ok: false, error: 'Incorrect password' }
  }

  const cookieStore = await cookies()
  cookieStore.set(BLOG_ADMIN_COOKIE, 'authorized', {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8,
    secure: process.env.NODE_ENV === 'production',
  })
  return { ok: true }
}

export async function logoutBlogAdmin(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(BLOG_ADMIN_COOKIE)
}

export async function saveBlogPostAction(formData: FormData): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    await requireAdmin()

    const id = String(formData.get('id') || '').trim()
    const slug = String(formData.get('slug') || '').trim()
    const title = String(formData.get('title') || '').trim()
    const excerpt = String(formData.get('excerpt') || '').trim()
    const contentHtml = String(formData.get('contentHtml') || '')
    const alternateHref = String(formData.get('alternateHref') || '').trim() || null
    const seoTitle = String(formData.get('seoTitle') || '').trim() || null
    const seoDescription = String(formData.get('seoDescription') || '').trim() || null
    const seoKeywordsRaw = String(formData.get('seoKeywords') || '').trim()
    const canonicalUrl = String(formData.get('canonicalUrl') || '').trim() || null
    const ogTitle = String(formData.get('ogTitle') || '').trim() || null
    const ogDescription = String(formData.get('ogDescription') || '').trim() || null
    const ogImageUrl = String(formData.get('ogImageUrl') || '').trim() || null
    const heroImageUrl = String(formData.get('heroImageUrl') || '').trim() || null
    const authorName = String(formData.get('authorName') || '').trim() || null
    const status =
      String(formData.get('status') || 'DRAFT') === 'PUBLISHED'
        ? BlogPostStatus.PUBLISHED
        : BlogPostStatus.DRAFT
    const isIndexable = formData.get('isIndexable') === 'on'

    if (!slug || !title || !excerpt) {
      return { ok: false, error: 'Slug, title, and excerpt are required' }
    }

    const payload = {
      slug,
      title,
      excerpt,
      contentHtml,
      alternateHref,
      seoTitle,
      seoDescription,
      seoKeywords: seoKeywordsRaw
        ? seoKeywordsRaw.split(',').map((keyword) => keyword.trim()).filter(Boolean)
        : [],
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImageUrl,
      heroImageUrl,
      authorName,
      status,
      isIndexable,
    }

    if (id) {
      const post = await updateBlogPostAdmin(id, payload)
      return { ok: true, id: post.id }
    }

    const post = await createBlogPostAdmin(payload)
    return { ok: true, id: post.id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to save post' }
  }
}

export async function deleteBlogPostAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    await deleteBlogPostAdmin(id)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to delete post' }
  }
}

export async function registerUploadedMediaAction(input: {
  blogPostId: string
  type: 'IMAGE' | 'VIDEO'
  role?: string
  url: string
  publicId?: string
  width?: number
  height?: number
  duration?: number
  bytes?: number
  format?: string
  altText?: string
}): Promise<{ ok: boolean; mediaId?: string; error?: string }> {
  try {
    await requireAdmin()
    const role: BlogMediaRole = isBlogImageRole(input.role ?? '')
      ? (input.role as BlogMediaRole)
      : BlogMediaRole.GALLERY
    const media = await addBlogMediaAdmin({
      blogPostId: input.blogPostId,
      type: input.type === 'VIDEO' ? BlogMediaType.VIDEO : BlogMediaType.IMAGE,
      role,
      url: input.url,
      publicId: input.publicId,
      width: input.width,
      height: input.height,
      duration: input.duration,
      bytes: input.bytes,
      format: input.format,
      altText: input.altText,
    })
    return { ok: true, mediaId: media.id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to save media' }
  }
}

export async function removeBlogMediaAction(mediaId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    await deleteBlogMediaAdmin(mediaId)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to remove media' }
  }
}

export async function updateMediaAltTextAction(
  mediaId: string,
  altText: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    await updateBlogMediaAltAdmin(mediaId, altText)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to save alt text' }
  }
}

export async function setHeroFromMediaAction(
  blogPostId: string,
  mediaId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    await setBlogHeroFromMediaAdmin(blogPostId, mediaId)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to set hero image' }
  }
}
