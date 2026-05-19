'use client'

import { guestStorage } from '@/features/guest-assistant/lib/guestStorage'
import { useStayStore } from '@/features/guest-assistant/stores/stayStore'

const HARD_SIGNOUT_AT_KEY = 'zenvana_hard_signout_at'
const BOOKING_CACHE_PREFIX = 'zenvana_booking_cache:'
const HARD_SIGNOUT_TTL_MS = 2 * 60 * 1000

export function isHardSignoutActive(): boolean {
  const raw = localStorage.getItem(HARD_SIGNOUT_AT_KEY)
  if (!raw) return false
  const ts = Number(raw)
  if (!Number.isFinite(ts)) return false
  const active = Date.now() - ts < HARD_SIGNOUT_TTL_MS
  if (!active) localStorage.removeItem(HARD_SIGNOUT_AT_KEY)
  return active
}

export function hardSignout(): void {
  localStorage.setItem(HARD_SIGNOUT_AT_KEY, String(Date.now()))
  guestStorage.clearAll()
  useStayStore.getState().clear()
  localStorage.removeItem('roomNumberId')
  localStorage.removeItem('bookingId')
  localStorage.removeItem('phoneNumber')
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(BOOKING_CACHE_PREFIX)) {
      localStorage.removeItem(key)
    }
  }
}
