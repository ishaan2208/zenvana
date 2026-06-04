import type { PublicPropertyListItem } from '@/lib/api'
import { getPublicPropertyBySlug } from '@/lib/api'
import { pickHeroAndGallery } from '@/lib/media'

export type PyramidTier = 'essential' | 'refined' | 'signature'

/**
 * Editorial overlay for a property, keyed by slug. This does NOT define the
 * roster — the rendered collection comes from the live backend
 * (getPublicProperties). The overlay only adds the tier, an operator-sanctioned
 * essence line, a branded display-name override, and a curated fallback image
 * for known properties. Anything the backend returns that isn't listed here
 * still renders, using its real API copy/imagery and the default tier.
 */
export type PyramidOverlayEntry = {
  /** Branded display name override (e.g. "Monte Verde"). Falls back to publicName. */
  name?: string
  tier: PyramidTier
  /** Operator-sanctioned essence line. Falls back to the property's API description. */
  intent?: string
  /** Curated local image, used only when the backend has no gallery/hero image. */
  imageSrc?: string
}

export type PyramidCardData = {
  name: string
  slug: string
  tier: PyramidTier
  intent: string
  imageUrls: string[]
}

const DEFAULT_TIER: PyramidTier = 'refined'
const MAX_SLIDES = 8

/**
 * Slug → editorial overlay. The five original entries carry operator-approved
 * copy + curated crops. Limewood & Serenewood are listed so they inherit a tier;
 * their essence + imagery come from the backend (no invented copy).
 *
 * ⚠️ Limewood/Serenewood tiers are sensible defaults — adjust to the operator's
 * intended positioning when confirmed.
 */
export const PYRAMID_OVERLAY: Record<string, PyramidOverlayEntry> = {
  rosewood: {
    name: 'Rosewood',
    tier: 'essential',
    intent:
      'A clean, light-led entry stay — designed around the bed, the morning, and the road back into the city.',
    imageSrc: '/images/dehradun/Rosewood.png',
  },
  silkwood: {
    name: 'Silkwood',
    tier: 'refined',
    intent:
      'A few quiet steps up — softer materials, more space, and the kind of room that suits longer evenings.',
    imageSrc: '/images/dehradun/silkwood .png',
  },
  cherrywood: {
    name: 'Cherrywood',
    tier: 'refined',
    intent:
      'A higher vantage point, calmer evenings, and a slower city to watch from above.',
    imageSrc: '/images/dehradun/cherrwood building pic 1.png',
  },
  monteverde: {
    name: 'Monte Verde',
    tier: 'signature',
    intent:
      'Our most considered stay — generous proportions, soft lighting, and a rhythm built for unhurried days.',
    imageSrc: '/images/dehradun/MonteVerde.png',
  },
  silverwood: {
    name: 'Silverwood',
    tier: 'signature',
    intent:
      'Framed views of the foothills and a quieter pace — the room you choose when the trip itself is the point.',
    imageSrc: '/images/dehradun/SILVER W BUILDING PIC.png',
  },
  // Backend-sourced copy/imagery; tiers are adjustable defaults.
  limewood: { name: 'Limewood', tier: 'refined' },
  serenewood: { name: 'Serenewood', tier: 'signature' },
}

/** Tier render order (Essential → Refined → Signature). */
export const PYRAMID_TIER_ORDER: PyramidTier[] = ['essential', 'refined', 'signature']

/** Count of known/curated properties — used as a safe fallback when the backend is unreachable. */
export const KNOWN_PROPERTY_COUNT = Object.keys(PYRAMID_OVERLAY).length

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const url of urls) {
    if (!url || seen.has(url)) continue
    seen.add(url)
    out.push(url)
  }
  return out
}

/**
 * Synthetic roster built from the editorial overlay. Used ONLY when the live
 * backend returns nothing, so the collection never renders blank. These map to
 * real /hotels/[slug] routes.
 */
export function fallbackPyramidProperties(): PublicPropertyListItem[] {
  return Object.entries(PYRAMID_OVERLAY).map(([slug, overlay], i) => ({
    id: -1 - i,
    slug,
    publicName: overlay.name ?? slug,
    city: 'Dehradun',
    state: 'Uttarakhand',
  }))
}

/**
 * Build render-ready pyramid cards from the LIVE property roster. The roster is
 * the single source of truth for which hotels appear; the overlay only enriches
 * known ones. Falls back to the property's own API description/hero image, and
 * finally to an empty image list (the card then renders a branded gradient).
 */
export async function buildPyramidCardData(
  properties: PublicPropertyListItem[],
): Promise<PyramidCardData[]> {
  return Promise.all(
    properties.map(async (p) => {
      const overlay = PYRAMID_OVERLAY[p.slug]
      const detail = await getPublicPropertyBySlug(p.slug).catch(() => null)
      const { gallery } = pickHeroAndGallery(detail?.images)
      const fromApi = dedupeUrls(gallery.map((img) => img.url))

      const fallbackImg = overlay?.imageSrc ?? p.heroImageUrl ?? undefined

      let imageUrls: string[]
      if (fromApi.length >= 2) {
        imageUrls = fromApi.slice(0, MAX_SLIDES)
      } else if (fromApi.length === 1 && fallbackImg && fromApi[0] !== fallbackImg) {
        imageUrls = [fromApi[0], fallbackImg]
      } else if (fromApi.length === 1) {
        imageUrls = fromApi
      } else if (fallbackImg) {
        imageUrls = [fallbackImg]
      } else {
        imageUrls = []
      }

      const intent =
        overlay?.intent ??
        detail?.descriptionShort?.trim() ??
        p.shortDescription?.trim() ??
        ''

      return {
        name: overlay?.name ?? p.publicName,
        slug: p.slug,
        tier: overlay?.tier ?? DEFAULT_TIER,
        intent,
        imageUrls,
      }
    }),
  )
}
