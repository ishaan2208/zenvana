'use client'

import { create } from 'zustand'

import type { GuestStayPhase } from '../types'

export type StayContext = {
  source: 'zenvana' | 'walkin' | 'qr'
  bookingId: number
  phoneNumber: string
  bookingRoomId?: number
  phase: GuestStayPhase
  zenvanaAccountId?: number
  slug?: string | null
}

type StayState = {
  ctx: StayContext | null
  booking: unknown | null
  setStay: (ctx: StayContext, booking: unknown) => void
  clear: () => void
}

export const useStayStore = create<StayState>((set) => ({
  ctx: null,
  booking: null,
  setStay: (ctx, booking) => set({ ctx, booking }),
  clear: () => set({ ctx: null, booking: null }),
}))
