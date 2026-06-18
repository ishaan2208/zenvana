/** @type {import('next').NextConfig} */
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
let backendHost = 'localhost'
try {
  backendHost = new URL(backendUrl).hostname
} catch {
  backendHost = 'localhost'
}

const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh4.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh5.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh6.googleusercontent.com' },
      { protocol: 'https', hostname: 'maps.gstatic.com' },
      { protocol: 'https', hostname: backendHost },
      { protocol: 'http', hostname: backendHost },
    ],
    // AVIF first (~20-30% smaller than WebP) for Vercel-optimized (local/Unsplash) images.
    formats: ['image/avif', 'image/webp'],
    // Drop the 2048/3840 tiers — a hotel site never needs 4K source variants, and
    // these widths flow into every srcset (including the Cloudinary-loader images).
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Cache optimized (local/Unsplash) derivatives for a year instead of 60s so Vercel
    // stops re-pulling sources. Cloudinary-direct images are immutable + versioned already.
    minimumCacheTTL: 31536000,
  },
}

module.exports = nextConfig
