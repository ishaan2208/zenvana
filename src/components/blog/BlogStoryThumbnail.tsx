import Image from 'next/image'
import Link from 'next/link'
import type { BlogMedia, BlogPost } from '@prisma/client'

import {
  resolveBlogHeroImages,
  resolveBlogThumbnail,
} from '@/lib/blogImageResolver'

type PostWithMedia = Pick<BlogPost, 'heroImageUrl' | 'ogImageUrl' | 'title'> & {
  media: BlogMedia[]
}

type Props = {
  post: PostWithMedia
  href: string
  /**
   * Editorial aspect ratio for this thumbnail.
   *  - "3/2"  → matches the THUMBNAIL upload spec exactly (default).
   *  - "16/9" → uses HERO_DESKTOP for the long-read break.
   *  - "1/1"  → square crop for departments index.
   *  - "4/5"  → portrait crop for sidebar / cover-adjacent cards.
   */
  aspect?: '3/2' | '16/9' | '1/1' | '4/5'
  sizes?: string
  priority?: boolean
  loading?: 'eager' | 'lazy'
  className?: string
}

const ASPECT_CLASS: Record<NonNullable<Props['aspect']>, string> = {
  '3/2': 'aspect-[3/2]',
  '16/9': 'aspect-[16/9]',
  '1/1': 'aspect-square',
  '4/5': 'aspect-[4/5]',
}

/**
 * Reusable editorial thumbnail. Picks the right image variant from a post's
 * media set for the requested aspect, falling back through the resolver chain.
 *
 * - 3/2 → THUMBNAIL (preferred) → HERO_DESKTOP → legacy hero
 * - 16/9 → HERO_DESKTOP → THUMBNAIL → legacy hero
 * - 1/1 / 4/5 → THUMBNAIL → HERO_DESKTOP → legacy hero (cropped by object-cover)
 *
 * Always wraps in a Link with an aria-label so the whole image is clickable
 * and the alt text isn't duplicated audibly.
 */
export function BlogStoryThumbnail({
  post,
  href,
  aspect = '3/2',
  sizes = '(min-width: 1024px) 32vw, (min-width: 640px) 45vw, 100vw',
  priority,
  loading,
  className = '',
}: Props) {
  // Pick the variant best matched to the requested aspect.
  let variant = resolveBlogThumbnail(post, post.title)
  if (aspect === '16/9') {
    const hero = resolveBlogHeroImages(post, post.title)
    variant = hero.desktop ?? variant
  }

  if (!variant) {
    return (
      <Link
        href={href}
        aria-label={post.title}
        className={`group relative block w-full overflow-hidden bg-muted ${ASPECT_CLASS[aspect]} ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-card to-muted" />
      </Link>
    )
  }

  return (
    <Link
      href={href}
      aria-label={post.title}
      className={`group relative block w-full overflow-hidden ${ASPECT_CLASS[aspect]} ${className}`}
    >
      <Image
        src={variant.url}
        alt={variant.alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={loading}
        className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
        unoptimized={variant.url.startsWith('http')}
      />
    </Link>
  )
}
