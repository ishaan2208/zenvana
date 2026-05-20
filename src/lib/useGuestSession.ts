'use client'

import { useCallback, useEffect, useState } from 'react'

import { getZenvanaGuestMe, type ZenvanaGuestMe } from '@/lib/zenvanaGuestApi'

export type GuestSessionState = {
  /** undefined = still loading, null = signed out, object = signed in */
  guest: ZenvanaGuestMe | null | undefined
  loading: boolean
  signedIn: boolean
  /** Re-fetch the session (use after a login modal closes). */
  refresh: () => Promise<void>
}

/**
 * Single source of truth for the current ZenvanaGuest session on the client.
 *
 * Backed by `GET /api/v1/public/zenvana-guest/me` (cookie auth, credentials: include).
 * Components consume `signedIn` for gating and `guest` for greetings / avatars.
 *
 * We rebroadcast updates on `window:zenvana-guest-session` so multiple instances
 * of this hook on a page stay in sync after login/logout without a global store.
 */
export function useGuestSession(): GuestSessionState {
  const [guest, setGuest] = useState<ZenvanaGuestMe | null | undefined>(undefined)

  const load = useCallback(async () => {
    try {
      const me = await getZenvanaGuestMe()
      setGuest(me)
    } catch {
      setGuest(null)
    }
  }, [])

  useEffect(() => {
    void load()
    const onUpdate = () => void load()
    window.addEventListener('zenvana-guest-session', onUpdate)
    // Also re-load when the tab becomes visible so a sign-in in another tab carries over.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('zenvana-guest-session', onUpdate)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [load])

  return {
    guest: guest,
    loading: guest === undefined,
    signedIn: Boolean(guest),
    refresh: load,
  }
}

/** Fire after a successful login/logout so other hook instances re-load. */
export function broadcastGuestSessionChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('zenvana-guest-session'))
  }
}
