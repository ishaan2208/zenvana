import { BlogMediaRole, type BlogMedia, type BlogPost } from '@prisma/client'

type PostWithMedia = Pick<BlogPost, 'heroImageUrl' | 'ogImageUrl'> & {
  media: BlogMedia[]
}

export type BlogImageVariant = {
  url: string
  alt: string
  width?: number | null
  height?: number | null
}

export type BlogHeroImage = {
  desktop: BlogImageVariant | null
  mobile: BlogImageVariant | null
  /** The best image we have for the hero, used as the <img> fallback inside <picture>. */
  primary: BlogImageVariant | null
}

function firstByRole(media: BlogMedia[], role: BlogMediaRole): BlogMedia | undefined {
  return media.find((item) => item.role === role && item.url)
}

function toVariant(media: BlogMedia, fallbackAlt: string): BlogImageVariant {
  return {
    url: media.url,
    alt: media.altText?.trim() || fallbackAlt,
    width: media.width,
    height: media.height,
  }
}

/**
 * Resolve the hero variants for a post.
 *
 * Resolution order:
 *  1. Role-tagged media (HERO_DESKTOP / HERO_MOBILE).
 *  2. Legacy `BlogPost.heroImageUrl` column (used both as desktop and mobile fallback).
 *
 * Always returns a `primary` if any image is available — that's what
 * non-`<picture>` consumers (OG cards, schema, list cards w/o thumbnail) use.
 */
export function resolveBlogHeroImages(post: PostWithMedia, fallbackAlt: string): BlogHeroImage {
  const desktopMedia = firstByRole(post.media, BlogMediaRole.HERO_DESKTOP)
  const mobileMedia = firstByRole(post.media, BlogMediaRole.HERO_MOBILE)

  const desktop = desktopMedia
    ? toVariant(desktopMedia, fallbackAlt)
    : post.heroImageUrl
    ? { url: post.heroImageUrl, alt: fallbackAlt, width: null, height: null }
    : null

  const mobile = mobileMedia
    ? toVariant(mobileMedia, fallbackAlt)
    : desktop // graceful fall-back — desktop image still renders, just not cropped for mobile

  return {
    desktop,
    mobile,
    primary: desktop ?? mobile ?? null,
  }
}

/**
 * Resolve the card / listing thumbnail for a post.
 *
 * Resolution order:
 *  1. Role-tagged THUMBNAIL.
 *  2. HERO_DESKTOP (cropped by CSS object-cover).
 *  3. Legacy `BlogPost.heroImageUrl`.
 */
export function resolveBlogThumbnail(
  post: PostWithMedia,
  fallbackAlt: string,
): BlogImageVariant | null {
  const thumbnail = firstByRole(post.media, BlogMediaRole.THUMBNAIL)
  if (thumbnail) return toVariant(thumbnail, fallbackAlt)
  const hero = firstByRole(post.media, BlogMediaRole.HERO_DESKTOP)
  if (hero) return toVariant(hero, fallbackAlt)
  if (post.heroImageUrl) return { url: post.heroImageUrl, alt: fallbackAlt, width: null, height: null }
  return null
}

/**
 * Resolve the Open Graph image URL.
 *
 * Resolution order:
 *  1. Role-tagged OG (always 1200×630).
 *  2. Legacy `BlogPost.ogImageUrl`.
 *  3. Hero desktop image (Google still accepts these).
 *  4. Legacy `BlogPost.heroImageUrl`.
 */
export function resolveBlogOgImage(post: PostWithMedia): BlogImageVariant | null {
  const og = firstByRole(post.media, BlogMediaRole.OG)
  if (og) return toVariant(og, 'Open Graph card')
  if (post.ogImageUrl) {
    return { url: post.ogImageUrl, alt: 'Open Graph card', width: 1200, height: 630 }
  }
  const hero = firstByRole(post.media, BlogMediaRole.HERO_DESKTOP)
  if (hero) return toVariant(hero, 'Open Graph card')
  if (post.heroImageUrl) {
    return { url: post.heroImageUrl, alt: 'Open Graph card', width: null, height: null }
  }
  return null
}

/** All GALLERY-role media for the post (sorted by sortOrder). */
export function resolveBlogGallery(post: PostWithMedia): BlogMedia[] {
  return post.media
    .filter((item) => item.role === BlogMediaRole.GALLERY && item.type === 'IMAGE')
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/** Inline images uploaded for embedding into the article body. */
export function resolveBlogInlineImages(post: PostWithMedia): BlogMedia[] {
  return post.media.filter((item) => item.role === BlogMediaRole.INLINE && item.type === 'IMAGE')
}
