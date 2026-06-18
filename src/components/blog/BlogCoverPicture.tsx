import CloudinaryImage from '@/components/CloudinaryImage'

import type { BlogHeroImage } from '@/lib/blogImageResolver'

type Props = {
  hero: BlogHeroImage
  /** Vary class names per viewport with explicit aspect ratios that match the upload spec. */
  className?: string
  priority?: boolean
}

/**
 * Magazine-grade cover image. Uses `<picture>` so different uploaded
 * aspect variants render per viewport — no CSS crop fudging, no
 * forcing a 16:9 photo into a portrait 4:5 hole.
 *
 *   Desktop (≥ 768px): HERO_DESKTOP, 16:9 cinematic crop
 *   Mobile  (< 768px): HERO_MOBILE,  4:5 portrait crop (matches spec)
 *
 * Falls back gracefully if only one variant exists.
 */
export function BlogCoverPicture({ hero, className = '', priority = true }: Props) {
  if (!hero.primary) return null

  // We avoid <picture> here in favour of next/image with `media` srcSet pair
  // so we still get next/image's optimization + LCP heuristics. Two
  // `<CloudinaryImage>` components — one shown ≥ md, one < md.
  const desktop = hero.desktop ?? hero.primary
  const mobile = hero.mobile ?? hero.primary

  return (
    <div className={className}>
      {/* MOBILE: 4:5 portrait crop, matches HERO_MOBILE spec */}
      <div className="relative aspect-[4/5] w-full overflow-hidden md:hidden">
        <CloudinaryImage
          src={mobile.url}
          alt={mobile.alt}
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover"
        />
      </div>
      {/* TABLET + DESKTOP: 16:9 cinematic crop, matches HERO_DESKTOP spec */}
      <div className="relative hidden aspect-[16/9] w-full overflow-hidden md:block">
        <CloudinaryImage
          src={desktop.url}
          alt={desktop.alt}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 1280px, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  )
}
