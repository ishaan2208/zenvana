'use client'

import { createTicketFromItem } from '@/features/guest-assistant/lib/api'
import type { Booking } from '@/features/guest-assistant/types/booking.types'

function ctxFromBooking(booking: Booking, bookingRoomId: string) {
  const selectedRoom = booking?.BookingRoom?.find((room) => String(room.id) === bookingRoomId)
  const roomNumber =
    selectedRoom?.roomNumber || booking?.BookingRoom?.[0]?.roomNumber || 'N/A'

  const rawPropertyId =
    booking?.propertyId ??
    (booking as { property?: { id?: number } })?.property?.id ??
    selectedRoom?.propertyId ??
    booking?.BookingRoom?.[0]?.propertyId
  const propertyId = rawPropertyId != null ? Number(rawPropertyId) : undefined
  if (propertyId == null || Number.isNaN(propertyId)) {
    throw new Error('Missing propertyId for ticket context. Ensure booking data is loaded.')
  }

  const bookingId = booking?.id != null ? Number(booking.id) : undefined
  const roomId =
    selectedRoom?.roomId != null
      ? Number(selectedRoom.roomId)
      : booking?.BookingRoom?.[0]?.roomId != null
        ? Number(booking.BookingRoom[0].roomId)
        : undefined
  const guestId = booking?.guestId != null ? Number(booking.guestId) : undefined

  return {
    propertyId,
    bookingId: bookingId ?? null,
    roomId: roomId ?? null,
    guestId: guestId ?? null,
    bookingRoomId,
    roomNumber,
  }
}

export async function requestGuestServiceTicket(
  bookingRoomId: string,
  booking: Booking,
  type: string,
  isPaid = false,
  details?: string,
) {
  const ctx = ctxFromBooking(booking, bookingRoomId)
  return createTicketFromItem({ type, isChargeable: isPaid, details }, ctx)
}
