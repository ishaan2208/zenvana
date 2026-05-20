import { BlogMediaRole, BlogMediaType, BlogPostStatus, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PLACEHOLDER_HTML = `
<p>This article page is ready for publishing. Replace this placeholder section with your full SEO blog content, images, and internal links whenever you are ready.</p>
<p>You can structure this page with hotel highlights, local travel guidance, pricing tips, and booking recommendations to improve search visibility and user engagement.</p>
`.trim()

const blogSeedData = [
  {
    slug: 'best-hotel-in-dehradun',
    title: 'Best Hotel in Dehradun 2026: Luxury, Budget & Family Stays by Zenvana Group',
    excerpt:
      'A complete guide to Rosewood, Limewood, Silkwood, Monteverde, Serenwood, Silverwood, and Cherrywood for every kind of traveler.',
    alternateHref: '/best-hotel-in-dehradun',
    isIndexable: true,
    heroImageUrl: '/images/dehradun/restaurantImage.png',
    media: [
      {
        role: BlogMediaRole.HERO_DESKTOP,
        type: BlogMediaType.IMAGE,
        url: '/images/dehradun/restaurantImage.png',
        altText: 'Restaurant interior at Zenvana Dehradun property',
        sortOrder: 0,
      },
      {
        role: BlogMediaRole.THUMBNAIL,
        type: BlogMediaType.IMAGE,
        url: '/images/dehradun/restaurantImage.png',
        altText: 'Thumbnail for best hotel in Dehradun article',
        sortOrder: 1,
      },
    ],
  },
  {
    slug: 'best-hotels-near-rajpur-road-dehradun',
    title: 'Best Hotels Near Rajpur Road Dehradun (Local Stay Guide 2026)',
    excerpt:
      'Planning a Dehradun trip? Compare location, comfort, and access around Rajpur Road before you book.',
  },
  {
    slug: 'family-friendly-hotels-in-dehradun',
    title: 'Family-Friendly Hotels in Dehradun for Comfortable Group Stays',
    excerpt:
      'Find room types, practical amenities, and stay tips for stress-free family travel in Dehradun.',
  },
  {
    slug: 'budget-hotels-in-dehradun-with-comfort',
    title: 'Budget Hotels in Dehradun with Comfort, Clean Rooms & Good Value',
    excerpt:
      'A practical guide for travelers who want quality, location, and affordable pricing in one stay.',
  },
  {
    slug: 'luxury-hotel-stay-in-dehradun',
    title: 'Luxury Hotel Stay in Dehradun: What to Expect Before Booking',
    excerpt:
      'From room design to service quality, understand what creates a premium stay experience in the city.',
  },
  {
    slug: 'best-time-to-visit-dehradun-for-hotel-deals',
    title: 'Best Time to Visit Dehradun for Better Hotel Deals',
    excerpt:
      'Season-by-season booking insights to help you save more and plan a smoother Dehradun trip.',
  },
  {
    slug: 'dehradun-hotel-booking-checklist',
    title: 'Dehradun Hotel Booking Checklist for First-Time Travelers',
    excerpt:
      'A quick checklist to compare rooms, facilities, location, and support before finalizing your stay.',
  },
  {
    slug: 'business-travel-hotels-in-dehradun',
    title: 'Best Hotels in Dehradun for Business Travel and Work Trips',
    excerpt:
      'Discover business-friendly stays with practical amenities, smooth connectivity, and city access.',
  },
  {
    slug: 'romantic-stays-in-dehradun-for-couples',
    title: 'Romantic Stays in Dehradun for Couples (2026 Guide)',
    excerpt:
      'Explore calm locations, scenic settings, and cozy room choices for a more memorable couple getaway.',
  },
  {
    slug: 'where-to-stay-in-dehradun-near-mussoorie-road',
    title: 'Where to Stay in Dehradun Near Mussoorie Road',
    excerpt:
      'A neighborhood-focused guide to help you choose between city convenience and hill-side calm.',
  },
  {
    slug: 'dehradun-stay-guide-2025',
    title: 'Dehradun Stay Guide 2025 (Redirected)',
    excerpt: 'Old canonical post retained for redirect compatibility.',
    status: BlogPostStatus.DRAFT,
    isIndexable: false,
  },
  {
    slug: 'hotel-amenities-that-matter-most',
    title: 'Hotel Amenities That Matter Most for a Better Dehradun Stay',
    excerpt:
      'WiFi, room comfort, hygiene, support, and location—what actually impacts your stay experience.',
  },
  {
    slug: 'weekend-staycation-guide-dehradun',
    title: 'Weekend Staycation Guide: Dehradun Edition',
    excerpt:
      'A simple plan for short breaks with dining, local attractions, and smart hotel booking ideas.',
  },
] as const

const slugRedirects = [
  {
    fromSlug: 'dehradun-stay-guide-2025',
    toSlug: 'best-hotel-in-dehradun',
  },
] as const

async function main() {
  const now = new Date()

  for (const post of blogSeedData) {
    const upsertedPost = await prisma.blogPost.upsert({
      where: { slug: post.slug },
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        contentHtml: PLACEHOLDER_HTML,
        alternateHref: 'alternateHref' in post ? post.alternateHref : null,
        seoTitle: post.title,
        seoDescription: post.excerpt,
        heroImageUrl: 'heroImageUrl' in post ? post.heroImageUrl : null,
        status: 'status' in post ? post.status : BlogPostStatus.PUBLISHED,
        publishedAt: 'status' in post && post.status === BlogPostStatus.DRAFT ? null : now,
        isIndexable: 'isIndexable' in post ? post.isIndexable : false,
      },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        alternateHref: 'alternateHref' in post ? post.alternateHref : null,
        heroImageUrl: 'heroImageUrl' in post ? post.heroImageUrl : undefined,
        isIndexable: 'isIndexable' in post ? post.isIndexable : false,
        status: 'status' in post ? post.status : BlogPostStatus.PUBLISHED,
        publishedAt: 'status' in post && post.status === BlogPostStatus.DRAFT ? null : now,
      },
    })

    await prisma.blogMedia.deleteMany({
      where: { blogPostId: upsertedPost.id },
    })

    if ('media' in post && post.media.length > 0) {
      await prisma.blogMedia.createMany({
        data: post.media.map((media) => ({
          blogPostId: upsertedPost.id,
          type: media.type,
          role: media.role,
          url: media.url,
          altText: media.altText,
          sortOrder: media.sortOrder,
        })),
      })
    }
  }

  for (const redirect of slugRedirects) {
    await prisma.blogSlugRedirect.upsert({
      where: { fromSlug: redirect.fromSlug },
      update: { toSlug: redirect.toSlug },
      create: {
        fromSlug: redirect.fromSlug,
        toSlug: redirect.toSlug,
      },
    })
  }

  console.log(
    `Seeded ${blogSeedData.length} blog posts, ${slugRedirects.length} redirects, and refreshed media assets`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
