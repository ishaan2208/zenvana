import type { BlogHeroImage } from '@/lib/blogImageResolver'

type Props = {
  hero: BlogHeroImage
  /** Viewport breakpoint at which the desktop variant should kick in. */
  breakpoint?: number
  className?: string
  /** Apply LCP `fetchpriority="high"` for hero LCP boost. */
  priority?: boolean
}

/**
 * Renders the hero image as a true `<picture>` element so mobile users get
 * the portrait-cropped `HERO_MOBILE` variant while desktop gets the
 * landscape `HERO_DESKTOP`. Both variants are eager + high-priority on the
 * detail page so they count as the LCP element.
 *
 * Unlike `next/image`, this gives us *art direction* — different crops per
 * viewport rather than the same image at different sizes. That's what
 * actually makes a hero usable on a 390-wide phone.
 */
export function BlogHeroPicture({
  hero,
  breakpoint = 768,
  className = '',
  priority = true,
}: Props) {
  if (!hero.primary) return null

  const desktop = hero.desktop ?? hero.primary
  const mobile = hero.mobile ?? hero.primary
  const fallback = desktop

  return (
    <picture className={className}>
      <source media={`(min-width: ${breakpoint}px)`} srcSet={desktop.url} />
      <source media={`(max-width: ${breakpoint - 1}px)`} srcSet={mobile.url} />
      <img
        src={fallback.url}
        alt={fallback.alt}
        width={fallback.width || undefined}
        height={fallback.height || undefined}
        className="h-full w-full object-cover"
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        // The cast preserves React 19/Next 14 forward-compat for
        // fetchpriority (lowercase per HTML spec).
        {...({ fetchpriority: priority ? 'high' : 'auto' } as Record<string, string>)}
      />
    </picture>
  )
}
