export type SeoCheckSeverity = 'good' | 'warn' | 'fail'

export type SeoCheck = {
  id: string
  label: string
  severity: SeoCheckSeverity
  detail: string
}

export type SeoScore = {
  score: number /* 0–100 */
  checks: SeoCheck[]
  passing: number
  total: number
}

export type SeoMediaItem = {
  role:
    | 'HERO_DESKTOP'
    | 'HERO_MOBILE'
    | 'THUMBNAIL'
    | 'OG'
    | 'INLINE'
    | 'GALLERY'
  altText: string | null
}

export type SeoInput = {
  slug: string
  title: string
  excerpt: string
  contentHtml: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string[] | string
  heroImageUrl: string
  ogImageUrl: string
  canonicalUrl: string
  isIndexable: boolean
  /** Optional: media uploaded for this post so we can check role coverage + alt text. */
  media?: SeoMediaItem[]
}

function textFromHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function countWords(text: string) {
  return text.split(' ').filter(Boolean).length
}

function countHeadings(html: string, tag: 'h2' | 'h3') {
  const matches = html.match(new RegExp(`<${tag}\\b`, 'gi'))
  return matches ? matches.length : 0
}

function countImages(html: string) {
  const matches = html.match(/<img\b/gi)
  return matches ? matches.length : 0
}

function countInternalLinks(html: string) {
  const matches = html.match(/<a\b[^>]*href=["'](\/[^"']*|https?:\/\/(www\.)?zenvanahotels\.com[^"']*)["']/gi)
  return matches ? matches.length : 0
}

function normalizeKeywords(keywords: string[] | string): string[] {
  if (Array.isArray(keywords)) return keywords.map((k) => k.trim()).filter(Boolean)
  return keywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
}

/**
 * Heuristic SEO score for blog posts. Each check returns one of three states:
 *  - "good": passes cleanly, +1 to passing count
 *  - "warn": present but not ideal, +0.5
 *  - "fail": missing or broken, +0
 * The final score is rounded to the nearest percent.
 *
 * This is a checklist, not search-engine math — the goal is to nudge writers
 * toward consistent quality (lengths, structure, metadata) before publish.
 */
export function scoreBlogSeo(input: SeoInput): SeoScore {
  const keywords = normalizeKeywords(input.seoKeywords)
  const primaryKeyword = keywords[0]?.toLowerCase() ?? ''
  const title = input.title.trim()
  const seoTitle = (input.seoTitle || input.title).trim()
  const description = (input.seoDescription || input.excerpt).trim()
  const slug = input.slug.trim()
  const text = textFromHtml(input.contentHtml)
  const wordCount = countWords(text)
  const h2Count = countHeadings(input.contentHtml, 'h2')
  const h3Count = countHeadings(input.contentHtml, 'h3')
  const imageCount = countImages(input.contentHtml)
  const internalLinkCount = countInternalLinks(input.contentHtml)
  const lowerText = text.toLowerCase()

  const checks: SeoCheck[] = []

  // Title
  if (title.length >= 30 && title.length <= 65) {
    checks.push({ id: 'title-length', label: 'Title length', severity: 'good', detail: `${title.length} characters — ideal for SERP previews.` })
  } else if (title.length === 0) {
    checks.push({ id: 'title-length', label: 'Title length', severity: 'fail', detail: 'Title is required.' })
  } else {
    checks.push({
      id: 'title-length',
      label: 'Title length',
      severity: 'warn',
      detail: `${title.length} characters — aim for 30–65 to avoid truncation.`,
    })
  }

  // SEO title
  if (seoTitle.length > 0 && seoTitle.length <= 60) {
    checks.push({ id: 'seo-title', label: 'SEO title', severity: 'good', detail: `${seoTitle.length} chars (under 60).` })
  } else if (seoTitle.length === 0) {
    checks.push({ id: 'seo-title', label: 'SEO title', severity: 'warn', detail: 'Will fall back to the article title.' })
  } else {
    checks.push({ id: 'seo-title', label: 'SEO title', severity: 'warn', detail: `${seoTitle.length} chars — may truncate above 60.` })
  }

  // Description
  if (description.length >= 120 && description.length <= 160) {
    checks.push({
      id: 'description-length',
      label: 'Meta description',
      severity: 'good',
      detail: `${description.length} characters — sweet spot.`,
    })
  } else if (description.length === 0) {
    checks.push({ id: 'description-length', label: 'Meta description', severity: 'fail', detail: 'Add a 120–160 character description.' })
  } else if (description.length < 120) {
    checks.push({
      id: 'description-length',
      label: 'Meta description',
      severity: 'warn',
      detail: `${description.length} chars — extend to at least 120 for better SERP coverage.`,
    })
  } else {
    checks.push({
      id: 'description-length',
      label: 'Meta description',
      severity: 'warn',
      detail: `${description.length} chars — Google may truncate above 160.`,
    })
  }

  // Slug
  if (slug.length > 0 && slug.length <= 60 && /^[a-z0-9-]+$/.test(slug)) {
    checks.push({ id: 'slug', label: 'Clean slug', severity: 'good', detail: `/blog/${slug}` })
  } else if (!slug) {
    checks.push({ id: 'slug', label: 'Clean slug', severity: 'fail', detail: 'Slug is required.' })
  } else if (slug.length > 60) {
    checks.push({ id: 'slug', label: 'Clean slug', severity: 'warn', detail: `Slug is ${slug.length} chars — shorter is more shareable.` })
  } else {
    checks.push({ id: 'slug', label: 'Clean slug', severity: 'warn', detail: 'Use only lowercase letters, numbers, and hyphens.' })
  }

  // Word count
  if (wordCount >= 800) {
    checks.push({ id: 'word-count', label: 'Article length', severity: 'good', detail: `${wordCount} words — strong long-form length.` })
  } else if (wordCount >= 400) {
    checks.push({ id: 'word-count', label: 'Article length', severity: 'warn', detail: `${wordCount} words — consider expanding past 800 for stronger ranking.` })
  } else if (wordCount === 0) {
    checks.push({ id: 'word-count', label: 'Article length', severity: 'fail', detail: 'Article content is empty.' })
  } else {
    checks.push({ id: 'word-count', label: 'Article length', severity: 'fail', detail: `${wordCount} words — thin content under 400 words.` })
  }

  // Subheadings
  if (h2Count >= 3) {
    checks.push({
      id: 'subheadings',
      label: 'Subheadings',
      severity: 'good',
      detail: `${h2Count} H2${h3Count ? ` and ${h3Count} H3` : ''} sections — well structured.`,
    })
  } else if (h2Count + h3Count > 0) {
    checks.push({ id: 'subheadings', label: 'Subheadings', severity: 'warn', detail: `${h2Count} H2 sections — aim for 3+ for scannability.` })
  } else {
    checks.push({ id: 'subheadings', label: 'Subheadings', severity: 'warn', detail: 'No subheadings yet — add H2s to break up long passages.' })
  }

  // Hero image
  if (input.heroImageUrl) {
    checks.push({ id: 'hero', label: 'Hero image', severity: 'good', detail: 'Hero image set — used for social cards.' })
  } else {
    checks.push({ id: 'hero', label: 'Hero image', severity: 'warn', detail: 'No hero image — social cards will fall back to a default.' })
  }

  // OG image
  if (input.ogImageUrl || input.heroImageUrl) {
    checks.push({ id: 'og-image', label: 'Open Graph image', severity: 'good', detail: 'Open Graph image will render in social previews.' })
  } else {
    checks.push({ id: 'og-image', label: 'Open Graph image', severity: 'fail', detail: 'Add an OG/hero image for social previews.' })
  }

  // Role-aware image checks. These are the world-class additions: they verify
  // the writer used the strict upload spec rather than just pasting a URL.
  const media = input.media ?? []
  const hasHeroDesktop = media.some((m) => m.role === 'HERO_DESKTOP')
  const hasHeroMobile = media.some((m) => m.role === 'HERO_MOBILE')
  const hasThumbnail = media.some((m) => m.role === 'THUMBNAIL')
  const hasOgRole = media.some((m) => m.role === 'OG')

  if (hasHeroDesktop) {
    checks.push({ id: 'role-hero-desktop', label: 'Desktop hero variant', severity: 'good', detail: 'Dedicated 16:9 hero uploaded for desktop.' })
  } else if (input.heroImageUrl) {
    checks.push({
      id: 'role-hero-desktop',
      label: 'Desktop hero variant',
      severity: 'warn',
      detail: 'Using the legacy hero URL — upload a 2400×1350 image in the Media tab for a properly-sized desktop hero.',
    })
  } else {
    checks.push({ id: 'role-hero-desktop', label: 'Desktop hero variant', severity: 'fail', detail: 'No desktop hero set.' })
  }

  if (hasHeroMobile) {
    checks.push({
      id: 'role-hero-mobile',
      label: 'Mobile hero variant',
      severity: 'good',
      detail: '4:5 portrait crop uploaded — mobile readers see an image tailored to their viewport.',
    })
  } else {
    checks.push({
      id: 'role-hero-mobile',
      label: 'Mobile hero variant',
      severity: 'warn',
      detail: 'No mobile hero. Upload a 1200×1500 (4:5) crop so phones don’t see a wide letterbox above the fold.',
    })
  }

  if (hasThumbnail) {
    checks.push({
      id: 'role-thumbnail',
      label: 'Card thumbnail',
      severity: 'good',
      detail: '3:2 thumbnail uploaded — used in the listing and related-posts grid.',
    })
  } else {
    checks.push({
      id: 'role-thumbnail',
      label: 'Card thumbnail',
      severity: 'warn',
      detail: 'No dedicated thumbnail — listing cards will crop the desktop hero, which can hide key subjects.',
    })
  }

  if (hasOgRole) {
    checks.push({
      id: 'role-og',
      label: 'Social card (1.91:1)',
      severity: 'good',
      detail: 'Dedicated 1200×630 social card uploaded — opaque and pre-cropped for Facebook/Twitter/LinkedIn.',
    })
  } else if (input.ogImageUrl) {
    checks.push({
      id: 'role-og',
      label: 'Social card (1.91:1)',
      severity: 'warn',
      detail: 'Falling back to the legacy OG URL — upload a 1200×630 file for guaranteed social preview rendering.',
    })
  } else {
    checks.push({
      id: 'role-og',
      label: 'Social card (1.91:1)',
      severity: 'warn',
      detail: 'No dedicated OG image — social cards will fall back to the desktop hero, which may crop poorly.',
    })
  }

  if (media.length > 0) {
    const missingAlt = media.filter((m) => !m.altText || m.altText.trim().length < 4).length
    if (missingAlt === 0) {
      checks.push({
        id: 'image-alt-text',
        label: 'Image alt text',
        severity: 'good',
        detail: 'Every uploaded image has descriptive alt text.',
      })
    } else {
      checks.push({
        id: 'image-alt-text',
        label: 'Image alt text',
        severity: missingAlt === media.length ? 'fail' : 'warn',
        detail: `${missingAlt} of ${media.length} image${media.length === 1 ? '' : 's'} are missing alt text — required for SEO and screen readers.`,
      })
    }
  }

  // Inline images
  if (imageCount >= 1) {
    checks.push({ id: 'images', label: 'In-article imagery', severity: 'good', detail: `${imageCount} image${imageCount === 1 ? '' : 's'} embedded.` })
  } else {
    checks.push({ id: 'images', label: 'In-article imagery', severity: 'warn', detail: 'Adding 1–2 images improves dwell time and SERP appeal.' })
  }

  // Internal links
  if (internalLinkCount >= 2) {
    checks.push({
      id: 'internal-links',
      label: 'Internal links',
      severity: 'good',
      detail: `${internalLinkCount} internal link${internalLinkCount === 1 ? '' : 's'}.`,
    })
  } else if (internalLinkCount === 1) {
    checks.push({ id: 'internal-links', label: 'Internal links', severity: 'warn', detail: 'Add another internal link to a related page.' })
  } else {
    checks.push({ id: 'internal-links', label: 'Internal links', severity: 'warn', detail: 'Link to at least 2 related pages on zenvanahotels.com.' })
  }

  // Keywords
  if (keywords.length >= 3) {
    checks.push({ id: 'keywords', label: 'SEO keywords', severity: 'good', detail: `${keywords.length} keywords set.` })
  } else if (keywords.length > 0) {
    checks.push({ id: 'keywords', label: 'SEO keywords', severity: 'warn', detail: `Only ${keywords.length} keyword${keywords.length === 1 ? '' : 's'} — add 3–5 for richer targeting.` })
  } else {
    checks.push({ id: 'keywords', label: 'SEO keywords', severity: 'warn', detail: 'Add 3–5 target keywords for clarity.' })
  }

  // Primary keyword in title/body
  if (primaryKeyword) {
    const inTitle = title.toLowerCase().includes(primaryKeyword)
    const inBody = lowerText.includes(primaryKeyword)
    if (inTitle && inBody) {
      checks.push({ id: 'primary-keyword', label: 'Primary keyword usage', severity: 'good', detail: `"${primaryKeyword}" appears in title and body.` })
    } else if (inTitle || inBody) {
      checks.push({
        id: 'primary-keyword',
        label: 'Primary keyword usage',
        severity: 'warn',
        detail: `"${primaryKeyword}" should appear in both the title and the article body.`,
      })
    } else {
      checks.push({
        id: 'primary-keyword',
        label: 'Primary keyword usage',
        severity: 'fail',
        detail: `Primary keyword "${primaryKeyword}" is missing from title and body.`,
      })
    }
  }

  // Indexable
  if (input.isIndexable) {
    checks.push({ id: 'indexable', label: 'Allow indexing', severity: 'good', detail: 'This post will be added to the sitemap.' })
  } else {
    checks.push({ id: 'indexable', label: 'Allow indexing', severity: 'warn', detail: 'Indexing is off — Google will not list this post.' })
  }

  // Canonical
  if (!input.canonicalUrl || /^https?:\/\//.test(input.canonicalUrl) || input.canonicalUrl.startsWith('/')) {
    checks.push({ id: 'canonical', label: 'Canonical URL', severity: 'good', detail: input.canonicalUrl ? 'Custom canonical set.' : 'Defaults to the post URL.' })
  } else {
    checks.push({ id: 'canonical', label: 'Canonical URL', severity: 'warn', detail: 'Canonical should be absolute (https://…) or absolute path (/…).' })
  }

  const passing = checks.reduce((sum, check) => {
    if (check.severity === 'good') return sum + 1
    if (check.severity === 'warn') return sum + 0.5
    return sum
  }, 0)
  const score = Math.round((passing / checks.length) * 100)

  return { score, checks, passing, total: checks.length }
}
