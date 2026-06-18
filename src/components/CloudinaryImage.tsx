'use client'

import Image, { type ImageProps } from 'next/image'
import cloudinaryLoader from '@/lib/cloudinaryLoader'

// Neutral warm LQIP, shown blurred by next/image while the real image loads.
// Inline base64 → zero extra requests; ships in the SSR HTML for a smooth blur-up.
const DEFAULT_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxNicgaGVpZ2h0PScxMCc+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSdnJyB4MT0nMCcgeTE9JzAnIHgyPScxJyB5Mj0nMSc+PHN0b3Agb2Zmc2V0PScwJyBzdG9wLWNvbG9yPScjZWZlOWRmJy8+PHN0b3Agb2Zmc2V0PScxJyBzdG9wLWNvbG9yPScjZDZjZGJmJy8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9JzE2JyBoZWlnaHQ9JzEwJyBmaWxsPSd1cmwoI2cpJy8+PC9zdmc+'

/**
 * Drop-in `next/image` for data-driven images whose src MAY be a Cloudinary URL
 * (hotel / room / gallery / food / blog photos coming from the API).
 *
 * - Cloudinary URLs are delivered straight from Cloudinary's CDN as right-sized
 *   AVIF/WebP (`f_auto,q_auto,c_limit,w_<width>`), bypassing the Vercel optimizer.
 * - Any other src (local /public fallback, Unsplash, Google) transparently falls
 *   back to the Vercel optimizer via the same loader.
 * - Defaults to a blur-up LQIP placeholder; override with `placeholder`/`blurDataURL`.
 *
 * Use this instead of `<Image unoptimized={url.startsWith('http')} />`, which was
 * shipping full-resolution originals to the browser.
 */
export default function CloudinaryImage({
  placeholder,
  blurDataURL,
  ...props
}: ImageProps) {
  return (
    <Image
      {...props}
      loader={cloudinaryLoader}
      placeholder={placeholder ?? 'blur'}
      blurDataURL={blurDataURL ?? DEFAULT_BLUR_DATA_URL}
    />
  )
}
