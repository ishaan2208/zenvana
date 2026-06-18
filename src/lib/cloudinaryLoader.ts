/**
 * Custom next/image loader.
 *
 * Cloudinary URLs are transformed and served DIRECTLY from Cloudinary's CDN
 * (bypassing Vercel's image optimizer), so we stop paying Cloudinary bandwidth
 * for full-resolution originals and stop double-processing every image:
 *
 *   …/image/upload/f_auto,q_auto,c_limit,w_<width>/<rest>
 *
 * next/image already computes the right pixel `width` per breakpoint/DPR via its
 * srcset, so we only need f_auto (AVIF/WebP), q_auto (smart quality), and a width
 * cap that never upscales. The transform is *chained* in front of any existing
 * one, so it composes with art-directed crops (e.g. a component that passes
 * `…/upload/c_fill,g_auto,ar_4:5/<id>`) and with the backend's stopgap transform.
 *
 * Everything else (local /public assets, Unsplash, Google) falls through to the
 * Next.js/Vercel optimizer exactly as before.
 */

type LoaderArgs = { src: string; width: number; quality?: number };

const UPLOAD_MARKER = "/image/upload/";
// First segment after /upload/ that signals an existing transformation component.
const TRANSFORM_TOKEN =
  /(?:^|,)(?:c|w|h|q|f|e|g|b|ar|dpr|fl|r|o|l|u|t|x|y|z|a|co|bo|if|cs)_/;

export default function cloudinaryLoader({ src, width }: LoaderArgs): string {
  const markerAt = src.indexOf(UPLOAD_MARKER);
  const isCloudinary = src.includes("res.cloudinary.com") && markerAt !== -1;

  if (isCloudinary) {
    const insertAt = markerAt + UPLOAD_MARKER.length;
    const firstSegment = src.slice(insertAt).split("/")[0] || "";
    // Signed delivery can't be safely rewritten — leave it for the browser.
    if (firstSegment.startsWith("s--")) return src;
    const transform = `f_auto,q_auto,c_limit,w_${width}`;
    return src.slice(0, insertAt) + transform + "/" + src.slice(insertAt);
  }

  // Non-Cloudinary (local, Unsplash, Google, backend host) → keep Vercel optimizer.
  const params = new URLSearchParams({ url: src, w: String(width), q: "75" });
  return `/_next/image?${params.toString()}`;
}

/**
 * Art-direction helper: inject a smart-cropped aspect ratio into a Cloudinary URL
 * so we deliver the exact display aspect (fewer pixels) with the subject kept in
 * frame (`g_auto`) instead of CSS-cropping a full-aspect image. Pass an aspect
 * like '4:3' or '16:9'. CloudinaryImage's loader then chains width/format/quality
 * in front, yielding a right-sized, smart-cropped AVIF. No-ops on non-Cloudinary
 * and signed URLs, so it's safe to wrap any src.
 */
export function cldArt(src: string, aspectRatio: string, gravity = 'auto'): string {
  const markerAt = src.indexOf(UPLOAD_MARKER)
  if (!src.includes('res.cloudinary.com') || markerAt === -1) return src
  const insertAt = markerAt + UPLOAD_MARKER.length
  const firstSegment = src.slice(insertAt).split('/')[0] || ''
  if (firstSegment.startsWith('s--')) return src
  const crop = `c_fill,g_${gravity},ar_${aspectRatio}`
  return src.slice(0, insertAt) + crop + '/' + src.slice(insertAt)
}
