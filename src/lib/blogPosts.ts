export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  href?: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'best-hotel-in-dehradun',
    title: 'Best Hotel in Dehradun 2026: Luxury, Budget & Family Stays by Zenvana Group',
    excerpt:
      'A complete guide to Rosewood, Limewood, Silkwood, Monteverde, Serenwood, Silverwood, and Cherrywood for every kind of traveler.',
    href: '/best-hotel-in-dehradun',
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
]

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}

