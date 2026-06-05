import { stayCheckIn, stayCheckOut } from '@/lib/booking-room-dates'
import type { ChatbotGuestData } from '../api/chatbotClient'
import { guestStorage } from './guestStorage'
import { useStayStore } from '../stores/stayStore'
import type { GuestStayPhase } from '../types'

type GuestSession = {
  bookingId: number
  phoneNumber: string
  guestName?: string
  roomNumber?: string
  checkInDate?: string
  checkOutDate?: string
}

export function persistGuestSession(
  data: ChatbotGuestData,
  phoneNumber: string,
  source: 'qr' | 'walkin',
) {
  const bookingRooms = data.BookingRoom ?? []
  const roomId = data.selectedRoomId ?? data.bookingRoomId

  if (roomId != null) {
    localStorage.setItem('roomNumberId', String(roomId))
  }

  guestStorage.setSession({
    bookingId: data.id,
    phoneNumber: data.guestPhoneNumber ?? phoneNumber,
    roomNumber: data.roomNumber,
    guestName: data.guestName,
    checkInDate: String(stayCheckIn(bookingRooms[0]) || ''),
    checkOutDate: String(stayCheckOut(bookingRooms[0]) || ''),
  } satisfies GuestSession)

  useStayStore.getState().setStay(
    {
      source,
      bookingId: data.id,
      phoneNumber: data.guestPhoneNumber ?? phoneNumber,
      bookingRoomId: roomId,
      phase: 'inhouse',
      slug: null,
    },
    data,
  )
}

export function guestDestinationPath(data: ChatbotGuestData): string {
  const bookingRooms = (data.BookingRoom ?? []).filter(Boolean)
  const roomId = data.selectedRoomId ?? data.bookingRoomId
  if (roomId != null || bookingRooms.length <= 1) {
    return `/guest/stay?bookingId=${data.id}`
  }
  return '/guest/room'
}

export function hydrateStayFromContext(
  source: 'zenvana' | 'walkin' | 'qr',
  bookingId: number,
  phoneNumber: string,
  phase: string,
  slug: string | null,
  booking: unknown,
  bookingRoomId?: number,
) {
  useStayStore.getState().setStay(
    {
      source,
      bookingId,
      phoneNumber,
      bookingRoomId,
      phase: phase as GuestStayPhase,
      slug,
    },
    booking,
  )
}

export function redirectAfterGuestLogin(
  router: { push: (href: string) => void },
  data: ChatbotGuestData,
  phoneNumber: string,
  source: 'qr' | 'walkin',
) {
  persistGuestSession(data, phoneNumber, source)
  router.push(guestDestinationPath(data))
}
