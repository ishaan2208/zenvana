import type { BlogPost, BlogMedia } from '@prisma/client'

export type BlogPostWithMedia = BlogPost & { media: BlogMedia[] }

export type BlogTocItem = {
  id: string
  text: string
  level: 2 | 3
}

/**
 * Slugify a heading's text into a stable in-page anchor.
 * Used both at render time (to inject `id` attributes) and at parse time
 * (to build the table of contents).
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’“”]/g, '')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/**
 * Parse the sanitized HTML and return:
 *   - `html` with stable `id` attributes injected on <h2>/<h3> for anchor links
 *   - `toc` array describing the heading hierarchy for a Table of Contents
 */
export function decorateBlogHtmlWithToc(contentHtml: string): {
  html: string
  toc: BlogTocItem[]
} {
  const toc: BlogTocItem[] = []
  const seen = new Set<string>()
  const html = contentHtml.replace(
    /<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/gi,
    (_match, tag: string, attrs: string, inner: string) => {
      const level = tag.toLowerCase() === 'h2' ? 2 : 3
      const text = inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (!text) return `<${tag}${attrs}>${inner}</${tag}>`

      let id = slugifyHeading(text)
      if (!id) return `<${tag}${attrs}>${inner}</${tag}>`

      let suffix = 2
      while (seen.has(id)) {
        id = `${slugifyHeading(text)}-${suffix++}`
      }
      seen.add(id)

      toc.push({ id, text, level: level as 2 | 3 })
      const safeAttrs = attrs.replace(/\sid="[^"]*"/i, '')
      return `<${tag}${safeAttrs} id="${id}">${inner}</${tag}>`
    },
  )
  return { html, toc }
}

/**
 * Heuristic category derivation from a post's title, excerpt, and keywords.
 * Cheap, deterministic, and good enough for editorial chips + filtering
 * without needing a new schema field.
 */
export type BlogCategory =
  | 'Hotel Guides'
  | 'Budget Stays'
  | 'Luxury Stays'
  | 'Family Travel'
  | 'Food & Dining'
  | 'Local Experiences'
  | 'Travel Tips'

const CATEGORY_RULES: Array<{ category: BlogCategory; match: RegExp }> = [
  { category: 'Luxury Stays', match: /(luxury|premium|signature|suite|boutique|finest|best.*hotel)/i },
  { category: 'Budget Stays', match: /(budget|affordable|cheap|value|deal|under\s?\d|low.cost)/i },
  { category: 'Family Travel', match: /(family|kids|child|honeymoon|couple|romantic)/i },
  { category: 'Food & Dining', match: /(restaurant|dining|food|cafe|menu|cuisine|chef|breakfast|dinner)/i },
  { category: 'Local Experiences', match: /(walk|trail|sights|attraction|landmark|mussoorie|rajpur|things\s?to\s?do)/i },
  { category: 'Travel Tips', match: /(tip|guide|how\s?to|checklist|itinerary|plan|when\s?to)/i },
  { category: 'Hotel Guides', match: /(hotel|stay|room|accommodation|property)/i },
]

export function deriveBlogCategory(
  post: Pick<BlogPost, 'title' | 'excerpt' | 'seoKeywords'>,
): BlogCategory {
  const haystack = `${post.title} ${post.excerpt} ${(post.seoKeywords ?? []).join(' ')}`
  for (const rule of CATEGORY_RULES) {
    if (rule.match.test(haystack)) return rule.category
  }
  return 'Hotel Guides'
}

/**
 * Group posts by their derived category and return ordered counts —
 * useful for the sidebar facet on the blog index.
 */
export function groupPostsByCategory<T extends Pick<BlogPost, 'title' | 'excerpt' | 'seoKeywords'>>(
  posts: T[],
): Array<{ category: BlogCategory; count: number; posts: T[] }> {
  const buckets = new Map<BlogCategory, T[]>()
  for (const post of posts) {
    const category = deriveBlogCategory(post)
    const list = buckets.get(category) ?? []
    list.push(post)
    buckets.set(category, list)
  }
  return Array.from(buckets.entries())
    .map(([category, list]) => ({ category, count: list.length, posts: list }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Score-based related posts.
 * +3 for same category, +1 per shared keyword, +0.5 per shared author.
 */
export function getRelatedBlogPosts<
  T extends Pick<BlogPost, 'id' | 'title' | 'excerpt' | 'seoKeywords' | 'authorName'>,
>(current: T, all: T[], limit = 3): T[] {
  const currentCategory = deriveBlogCategory(current)
  const currentKeywords = new Set((current.seoKeywords ?? []).map((k) => k.toLowerCase()))

  const scored = all
    .filter((post) => post.id !== current.id)
    .map((post) => {
      const sharedKeywords = (post.seoKeywords ?? []).reduce(
        (sum, keyword) => (currentKeywords.has(keyword.toLowerCase()) ? sum + 1 : sum),
        0,
      )
      const sameCategory = deriveBlogCategory(post) === currentCategory ? 3 : 0
      const sameAuthor = post.authorName === current.authorName ? 0.5 : 0
      return { post, score: sharedKeywords + sameCategory + sameAuthor }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((entry) => entry.post)
}

/**
 * Share URL builders for native share + fallback social links.
 */
export function buildShareUrls(input: { url: string; title: string; excerpt?: string }) {
  const encodedUrl = encodeURIComponent(input.url)
  const encodedTitle = encodeURIComponent(input.title)
  const encodedSummary = encodeURIComponent(input.excerpt ?? input.title)
  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedSummary}%0A%0A${encodedUrl}`,
  }
}
