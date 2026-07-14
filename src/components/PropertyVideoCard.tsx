'use client'

import { useRef, useState } from 'react'
import { Film, Play, Plane } from 'lucide-react'

import type { PublicPropertyVideo } from '@/lib/api'
import {
  formatVideoDuration,
  resizeVideoPosterUrl,
} from '@/lib/cloudinary-video'

const KIND_LABEL: Record<PublicPropertyVideo['kind'], string> = {
  walkthrough: 'Walkthrough',
  drone: 'Drone view',
}

/**
 * Poster + tap-to-play property film card. Data-friendly by design:
 * no autoplay, `<video>` mounts only on tap, hls.js loads only after tap on
 * browsers without native HLS (Safari plays the manifest natively), and the
 * mp4 fallback is 720p-capped by the backend. Aspect ratio is reserved from
 * the video's real dimensions so nothing shifts when the player mounts.
 */
export function PropertyVideoCard({
  video,
  propertyName,
}: {
  video: PublicPropertyVideo
  propertyName: string
}) {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const aspect =
    video.width && video.height ? video.width / video.height : 16 / 9
  const label = video.title ?? KIND_LABEL[video.kind]
  const KindIcon = video.kind === 'drone' ? Plane : Film

  async function startPlayback(el: HTMLVideoElement) {
    const hlsUrl = video.hlsUrl
    const canNativeHls = el.canPlayType('application/vnd.apple.mpegurl') !== ''

    if (hlsUrl && canNativeHls) {
      el.src = hlsUrl
    } else if (hlsUrl) {
      try {
        const { default: Hls } = await import('hls.js')
        if (Hls.isSupported()) {
          const hls = new Hls({ capLevelToPlayerSize: true })
          hls.loadSource(hlsUrl)
          hls.attachMedia(el)
        } else {
          el.src = video.playbackUrl
        }
      } catch {
        el.src = video.playbackUrl
      }
    } else {
      el.src = video.playbackUrl
    }

    try {
      await el.play()
    } catch {
      /* user gesture expired or autoplay policy — controls remain usable */
    }
  }

  return (
    <figure className="group relative overflow-hidden rounded-[1.25rem] border border-border/60 bg-card/60">
      <div className="relative w-full" style={{ aspectRatio: String(aspect) }}>
        {playing ? (
          <video
            ref={(el) => {
              if (el && !videoRef.current) {
                videoRef.current = el
                void startPlayback(el)
              }
            }}
            controls
            playsInline
            preload="none"
            poster={video.posterUrl}
            aria-label={`${label} video of ${propertyName}`}
            className="absolute inset-0 h-full w-full bg-black object-contain"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${label.toLowerCase()} video of ${propertyName}`}
            className="absolute inset-0 h-full w-full text-left"
          >
            {/* Plain <img>: video-derived poster URLs can't go through the
                image loader; srcset keeps mobile payloads small. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resizeVideoPosterUrl(video.posterUrl, 1280)}
              srcSet={[640, 960, 1280]
                .map((w) => `${resizeVideoPosterUrl(video.posterUrl, w)} ${w}w`)
                .join(', ')}
              sizes="(max-width: 640px) 100vw, 50vw"
              alt={`${label} preview of ${propertyName}`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.25)_0%,transparent_35%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />

            {/* Centered play affordance */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md transition duration-300 group-hover:scale-105 group-hover:bg-black/55">
                <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
              </span>
            </span>

            {/* Kind chip + duration */}
            <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/45 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white backdrop-blur-md">
              <KindIcon className="h-3 w-3" aria-hidden />
              {KIND_LABEL[video.kind]}
            </span>
            {video.durationSec ? (
              <span className="absolute bottom-3.5 right-3.5 rounded-full border border-white/25 bg-black/45 px-2 py-0.5 text-[10px] font-medium tabular-nums text-white backdrop-blur-md">
                {formatVideoDuration(video.durationSec)}
              </span>
            ) : null}
          </button>
        )}
      </div>

      <figcaption className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {propertyName}
        </span>
      </figcaption>
    </figure>
  )
}
