/**
 * Helpers for property video URLs. The backend builds and serves the actual
 * poster/playback/HLS URLs (single source of truth for transforms); these
 * helpers only do client-side sizing and formatting.
 */

/**
 * Swap the `w_<n>` transform inside a Cloudinary video poster URL so one
 * backend-built poster can serve a responsive srcset. Returns the original
 * URL unchanged when no width transform is present.
 */
export function resizeVideoPosterUrl(posterUrl: string, width: number): string {
  if (!/\/video\/upload\//.test(posterUrl)) return posterUrl
  if (!/([/,])w_\d+([,/])/.test(posterUrl)) return posterUrl
  return posterUrl.replace(/([/,])w_\d+([,/])/, `$1w_${Math.round(width)}$2`)
}

export type VideoPreviewOptions = {
  /** Pixel height cap (`h_N,c_limit`). Keep small: previews are ambience. */
  maxHeight: number
  /** Truncate the encoded clip (`so_0,du_N`) so loops never download the full film. */
  maxDurationSec?: number
  /** `q_auto:<tier>`; previews default to `eco`. */
  quality?: 'auto' | 'eco' | 'low'
}

const TRANSFORM_SEGMENT = /^(?:q_|f_|h_|w_|c_|so_|du_|ac_|sp_|e_)/

/**
 * Derive a cheap muted-preview rendition from the backend-built playback URL
 * (ambient hero loops, card dwell previews). Strips audio (`ac_none`), caps
 * height and duration, and drops quality to eco — so Cloudinary bandwidth is
 * paid only for the pixels a preview can actually show.
 *
 * Works by replacing the transform segment of `.../video/upload/<t>/<id>.<ext>`;
 * URLs that don't look like Cloudinary video deliveries pass through untouched.
 */
export function deriveVideoPreviewUrl(
  playbackUrl: string,
  { maxHeight, maxDurationSec, quality = 'eco' }: VideoPreviewOptions,
): string {
  const match = playbackUrl.match(
    /^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)([^/]+)\/(.+)$/,
  )
  if (!match) return playbackUrl

  const [, base, firstSegment, rest] = match
  const transforms = [
    quality === 'auto' ? 'q_auto' : `q_auto:${quality}`,
    'f_auto:video',
    `h_${Math.round(maxHeight)}`,
    'c_limit',
    'ac_none',
    ...(maxDurationSec ? ['so_0', `du_${Math.round(maxDurationSec)}`] : []),
  ].join(',')

  // First path segment is either the existing transform list (replace it) or
  // already part of the public id (keep it and prepend our transforms).
  return TRANSFORM_SEGMENT.test(firstSegment)
    ? `${base}${transforms}/${rest}`
    : `${base}${transforms}/${firstSegment}/${rest}`
}

/** Seconds → ISO 8601 duration (schema.org VideoObject), e.g. 95 → "PT1M35S". */
export function secondsToIsoDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  let out = 'PT'
  if (hours > 0) out += `${hours}H`
  if (minutes > 0) out += `${minutes}M`
  if (seconds > 0 || out === 'PT') out += `${seconds}S`
  return out
}

/** Seconds → human "m:ss" chip label, e.g. 95 → "1:35". */
export function formatVideoDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(s / 60)
  const seconds = s % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
