/**
 * @deprecated Legacy hardcoded blog registry. Use Prisma-backed helpers in `@/lib/blog`.
 * Kept for reference during migration scripts only.
 */
export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  href?: string
}

export const blogPosts: BlogPost[] = []

export function getBlogPostBySlug(_slug: string) {
  return undefined
}

export function getAllBlogSlugs() {
  return [] as string[]
}

export function isBlogSlugIndexable(_slug: string) {
  return false
}
