'use client'

import { useEffect, useState } from 'react'

const MIN_SPLASH_MS = 700
const FADE_OUT_MS = 320

type SplashPhase = 'visible' | 'fading' | 'hidden'

export function InitialSplash() {
  const [phase, setPhase] = useState<SplashPhase>('visible')

  useEffect(() => {
    let cancelled = false
    let fadeTimeout: number | null = null
    let onLoad: (() => void) | null = null

    const minDelayPromise = new Promise<void>((resolve) => {
      window.setTimeout(resolve, MIN_SPLASH_MS)
    })

    const readyPromise = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') {
        resolve()
        return
      }

      onLoad = () => resolve()
      window.addEventListener('load', onLoad, { once: true })
    })

    Promise.all([minDelayPromise, readyPromise]).then(() => {
      if (cancelled) return
      setPhase('fading')
      fadeTimeout = window.setTimeout(() => {
        if (!cancelled) setPhase('hidden')
      }, FADE_OUT_MS)
    })

    return () => {
      cancelled = true
      if (fadeTimeout != null) window.clearTimeout(fadeTimeout)
      if (onLoad) window.removeEventListener('load', onLoad)
    }
  }, [])

  if (phase === 'hidden') return null

  return (
    <div
      aria-live="polite"
      aria-label="Loading Zenvana"
      className={[
        'fixed inset-0 z-[260] flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(30,72,143,0.28),transparent_42%),linear-gradient(160deg,rgba(8,17,31,0.98)_0%,rgba(0,31,63,0.98)_58%,rgba(0,128,76,0.92)_100%)] transition-opacity duration-300 motion-reduce:transition-none',
        phase === 'fading' ? 'pointer-events-none opacity-0' : 'opacity-100',
      ].join(' ')}
    >
      <div className="px-6 text-center text-white">
        <p className="text-[10px] uppercase tracking-[0.34em] text-white/65">Welcome to</p>
        <h1 className="mt-3 font-serif text-[clamp(2rem,6vw,3.3rem)] tracking-[-0.04em]">
          Zenvana
        </h1>
        <p className="mt-2 text-xs tracking-[0.12em] text-white/70 sm:text-sm">
          Boutique stays on Rajpur Road
        </p>

        <div className="mx-auto mt-6 h-px w-28 bg-gradient-to-r from-transparent via-[#E8D693] to-transparent" />
        <div className="mt-4 inline-flex items-center gap-2 text-white/70">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E8D693]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E8D693] [animation-delay:140ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E8D693] [animation-delay:280ms]" />
        </div>
      </div>
    </div>
  )
}
