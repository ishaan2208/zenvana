'use client'

import { getMenuItemsForPhase } from '@/features/guest-assistant/constants/guestServiceByPhase'
import type { GuestServiceCategory } from '@/features/guest-assistant/constants/guestServiceTypes'
import { useStayStore } from '@/features/guest-assistant/stores/stayStore'
import type { Booking } from '@/features/guest-assistant/types/booking.types'

export { getFullInhouseMenu } from '@/features/guest-assistant/constants/guestInhouseMenu'

export function useGuestServiceMenu() {
  const booking = useStayStore((s) => s.booking) as Booking | null
  const phase = useStayStore((s) => s.ctx?.phase ?? 'inhouse')

  if (!booking?.BookingRoom?.length) {
    return [] as GuestServiceCategory[]
  }

  const bookingRoomId =
    (typeof window !== 'undefined' && localStorage.getItem('roomNumberId')) ||
    String(booking?.BookingRoom?.[0]?.id ?? '')

  return getMenuItemsForPhase(phase, booking, bookingRoomId)
}

export type {
  GuestServiceCategory,
  GuestServiceItem,
  ServiceKey,
} from '@/features/guest-assistant/constants/guestServiceTypes'
export { requestGuestServiceTicket } from '@/features/guest-assistant/constants/guestServiceTickets'
