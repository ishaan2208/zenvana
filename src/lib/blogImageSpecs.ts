/**
 * Single source of truth for blog image upload specifications.
 *
 * Every upload role (hero desktop / hero mobile / thumbnail / OG / inline /
 * gallery) has a strict spec — recommended dimensions, allowed aspect ratio
 * with a tolerance, min/max file size, allowed MIME types, and a short
 * editor-facing description of how the image will appear publicly.
 *
 * Both the client validator and the Cloudinary upload route consume this
 * file, so a spec change here propagates everywhere automatically.
 */

export type BlogImageRole =
  | 'HERO_DESKTOP'
  | 'HERO_MOBILE'
  | 'THUMBNAIL'
  | 'OG'
  | 'INLINE'
  | 'GALLERY'

export type BlogImageSpec = {
  role: BlogImageRole
  label: string
  shortLabel: string
  description: string
  /** Best-practice rendered ratio expressed as `width / height`. */
  aspectRatio: number
  /** Human-readable form of the ratio (e.g. "16:9"). */
  aspectLabel: string
  /** ± fractional tolerance permitted around `aspectRatio` (0.05 = 5%). */
  aspectTolerance: number
  /** Pixel dimensions we recommend for upload. */
  recommended: { width: number; height: number }
  /** Hard minimum the validator will accept (smaller → fail). */
  minimum: { width: number; height: number }
  /** Hard maximum the validator will accept (larger → fail, also auto-resized server-side). */
  maximum: { width: number; height: number }
  /** File size cap (bytes). */
  maxBytes: number
  /** Allowed MIME types. */
  allowedMimeTypes: readonly string[]
  /** Whether the role allows transparent PNGs (most don't, OG/social must be opaque). */
  allowTransparency: boolean
  /** Whether alt text is REQUIRED for this role for accessibility + SEO. */
  altTextRequired: boolean
  /** Cloudinary folder this role uploads into. */
  cloudinaryFolder: string
  /** Optional Cloudinary transformation chain applied at upload time. */
  cloudinaryTransformation?: string
  /** Whether this is a singleton (only one of this role per post). */
  singleton: boolean
}

const MB = 1024 * 1024

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const

export const BLOG_IMAGE_SPECS: Record<BlogImageRole, BlogImageSpec> = {
  HERO_DESKTOP: {
    role: 'HERO_DESKTOP',
    label: 'Desktop hero',
    shortLabel: 'Desktop hero',
    description:
      'Full-bleed background image on the blog post hero at tablet and desktop sizes (≥ 768px). Letterbox crop.',
    aspectRatio: 16 / 9,
    aspectLabel: '16:9',
    aspectTolerance: 0.05,
    recommended: { width: 2400, height: 1350 },
    minimum: { width: 1600, height: 900 },
    maximum: { width: 4000, height: 2250 },
    maxBytes: 4 * MB,
    allowedMimeTypes: IMAGE_TYPES,
    allowTransparency: false,
    altTextRequired: true,
    cloudinaryFolder: 'zenvana/blog/hero-desktop',
    cloudinaryTransformation: 'f_auto,q_auto:good,c_limit,w_2400',
    singleton: true,
  },
  HERO_MOBILE: {
    role: 'HERO_MOBILE',
    label: 'Mobile hero',
    shortLabel: 'Mobile hero',
    description:
      'Vertical hero shown on phones (< 768px). A 4:5 portrait crop keeps the subject readable above the fold.',
    aspectRatio: 4 / 5,
    aspectLabel: '4:5',
    aspectTolerance: 0.07,
    recommended: { width: 1200, height: 1500 },
    minimum: { width: 900, height: 1125 },
    maximum: { width: 2000, height: 2500 },
    maxBytes: 3 * MB,
    allowedMimeTypes: IMAGE_TYPES,
    allowTransparency: false,
    altTextRequired: true,
    cloudinaryFolder: 'zenvana/blog/hero-mobile',
    cloudinaryTransformation: 'f_auto,q_auto:good,c_limit,w_1200',
    singleton: true,
  },
  THUMBNAIL: {
    role: 'THUMBNAIL',
    label: 'Card thumbnail',
    shortLabel: 'Thumbnail',
    description:
      'Used in the blog listing grid, related-posts row, and any place this post is referenced as a card. 3:2 crop.',
    aspectRatio: 3 / 2,
    aspectLabel: '3:2',
    aspectTolerance: 0.05,
    recommended: { width: 1200, height: 800 },
    minimum: { width: 800, height: 533 },
    maximum: { width: 2400, height: 1600 },
    maxBytes: 2 * MB,
    allowedMimeTypes: IMAGE_TYPES,
    allowTransparency: false,
    altTextRequired: true,
    cloudinaryFolder: 'zenvana/blog/thumbnail',
    cloudinaryTransformation: 'f_auto,q_auto:eco,c_limit,w_1200',
    singleton: true,
  },
  OG: {
    role: 'OG',
    label: 'Open Graph / social',
    shortLabel: 'Social card',
    description:
      'The 1200×630 image rendered by Facebook, LinkedIn, Twitter, Slack, and WhatsApp previews. Must be opaque.',
    aspectRatio: 1200 / 630,
    aspectLabel: '1.91:1',
    aspectTolerance: 0.03,
    recommended: { width: 1200, height: 630 },
    minimum: { width: 1200, height: 630 },
    maximum: { width: 2400, height: 1260 },
    maxBytes: 1.5 * MB,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowTransparency: false,
    altTextRequired: true,
    cloudinaryFolder: 'zenvana/blog/og',
    cloudinaryTransformation: 'f_auto,q_auto:good,c_fill,w_1200,h_630,g_auto',
    singleton: true,
  },
  INLINE: {
    role: 'INLINE',
    label: 'Inline article image',
    shortLabel: 'Inline image',
    description:
      'Images embedded within the article body. Capped at 1600px wide and lazily loaded on the public site.',
    aspectRatio: 3 / 2,
    aspectLabel: 'flexible',
    aspectTolerance: 1,
    recommended: { width: 1600, height: 1067 },
    minimum: { width: 600, height: 400 },
    maximum: { width: 2400, height: 2400 },
    maxBytes: 3 * MB,
    allowedMimeTypes: IMAGE_TYPES,
    allowTransparency: true,
    altTextRequired: true,
    cloudinaryFolder: 'zenvana/blog/inline',
    cloudinaryTransformation: 'f_auto,q_auto:eco,c_limit,w_1600',
    singleton: false,
  },
  GALLERY: {
    role: 'GALLERY',
    label: 'Gallery image',
    shortLabel: 'Gallery',
    description:
      'Additional images rendered as a grid after the article body. Square-ish crops display best.',
    aspectRatio: 4 / 3,
    aspectLabel: '4:3',
    aspectTolerance: 0.25,
    recommended: { width: 1600, height: 1200 },
    minimum: { width: 800, height: 600 },
    maximum: { width: 2400, height: 2400 },
    maxBytes: 3 * MB,
    allowedMimeTypes: IMAGE_TYPES,
    allowTransparency: false,
    altTextRequired: true,
    cloudinaryFolder: 'zenvana/blog/gallery',
    cloudinaryTransformation: 'f_auto,q_auto:eco,c_limit,w_1600',
    singleton: false,
  },
}

export const BLOG_IMAGE_ROLES = Object.keys(BLOG_IMAGE_SPECS) as BlogImageRole[]

/**
 * The ordered list of roles surfaced as "Images" slots in the admin.
 * GALLERY is excluded — it's rendered as a free-form multi-upload list.
 */
export const BLOG_IMAGE_SLOT_ROLES: BlogImageRole[] = [
  'HERO_DESKTOP',
  'HERO_MOBILE',
  'THUMBNAIL',
  'OG',
]

export function getBlogImageSpec(role: BlogImageRole): BlogImageSpec {
  return BLOG_IMAGE_SPECS[role]
}

export function isBlogImageRole(value: string): value is BlogImageRole {
  return value in BLOG_IMAGE_SPECS
}

/** Pretty bytes (used in spec cards + error messages). */
export function formatBytes(bytes: number): string {
  if (bytes >= MB) return `${(bytes / MB).toFixed(bytes >= 10 * MB ? 0 : 1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

/** Pretty MB (used for max-size copy). */
export function describeMaxSize(bytes: number): string {
  return `${(bytes / MB).toFixed(bytes < MB ? 2 : 1).replace(/\.0$/, '')} MB`
}

/** Human-readable list of allowed extensions for an `accept` hint. */
export function describeAllowedTypes(types: readonly string[]): string {
  return types
    .map((type) => type.replace('image/', '').toUpperCase())
    .join(' · ')
}
