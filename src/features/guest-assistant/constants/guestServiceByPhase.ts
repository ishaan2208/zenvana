'use client'

import { getFullInhouseMenu } from '@/features/guest-assistant/constants/guestInhouseMenu'
import { requestGuestServiceTicket } from '@/features/guest-assistant/constants/guestServiceTickets'
import type {
  GuestServiceCategory,
  GuestServiceItem,
} from '@/features/guest-assistant/constants/guestServiceTypes'
import type { GuestStayPhase } from '@/features/guest-assistant/types'
import type { Booking } from '@/features/guest-assistant/types/booking.types'

export function getMenuItemsForPhase(
  phase: GuestStayPhase,
  booking: Booking,
  bookingRoomId: string,
): GuestServiceCategory[] {
  if (phase === 'inhouse') return getFullInhouseMenu(booking, bookingRoomId)
  if (phase === 'pre') return getPreStayMenu(booking, bookingRoomId)
  if (phase === 'post') return getPostStayMenu(booking, bookingRoomId)
  return []
}

function ticketItem(
  booking: Booking,
  bookingRoomId: string,
  type: string,
  label: string,
  reply: string,
  overrides: Partial<GuestServiceItem> = {},
): GuestServiceItem {
  return {
    type: type as GuestServiceItem['type'],
    label,
    kind: 'FUNCTION',
    featured: true,
    isChargeable: false,
    reply,
    action: (_details?: string) =>
      requestGuestServiceTicket(bookingRoomId, booking, type, false, _details),
    ...overrides,
  }
}

export function getPreStayMenu(booking: Booking, bookingRoomId: string): GuestServiceCategory[] {
  const receptionNo = booking?.property?.receptionNo ?? '100'
  const propertyName = booking?.property?.name ?? 'the property'

  return [
    {
      category: 'Before your stay',
      description: 'Pre-arrival requests for your upcoming visit',
      items: [
        ticketItem(
          booking,
          bookingRoomId,
          'EARLY_CHECKIN',
          'Early check-in',
          'Certainly. We have noted your early check-in request. Our team will confirm availability shortly.',
          { tileTitle: 'Early check-in', etaMinutes: 120 },
        ),
        ticketItem(
          booking,
          bookingRoomId,
          'AIRPORT_PICKUP',
          'Airport pickup',
          'Certainly. We have noted your airport pickup request. Our team will contact you with details.',
          { tileTitle: 'Airport pickup', etaMinutes: 60 },
        ),
        ticketItem(
          booking,
          bookingRoomId,
          'PRE_ARRIVAL_NOTE',
          'Special request',
          'Certainly. Your pre-arrival note has been shared with our team.',
          { tileTitle: 'Special request', etaMinutes: 240 },
        ),
        ticketItem(
          booking,
          bookingRoomId,
          'INVOICE_DETAILS',
          'Invoice / GST details',
          'Certainly. We have received your billing details and will update your reservation.',
          { tileTitle: 'Invoice / GST', etaMinutes: 240 },
        ),
      ],
    },
    {
      category: 'Helpful info',
      description: 'Contact and property details',
      items: [
        {
          type: 'PROPERTY_CONTACT',
          label: 'Property contact',
          tileTitle: 'Contact us',
          description: `Reach ${propertyName} front desk`,
          kind: 'FUNCTION',
          featured: true,
          isChargeable: false,
          reply: `You can reach ${propertyName} at ${receptionNo}.`,
          action: () => {
            window.open(`tel:${receptionNo}`, '_self')
          },
        },
        {
          type: 'CALL_RECEPTION',
          label: 'Call front desk',
          kind: 'FUNCTION',
          featured: false,
          isChargeable: false,
          reply: 'Connecting you to the front desk.',
          action: () => {
            window.open(`tel:${receptionNo}`, '_self')
          },
        },
      ],
    },
  ]
}

export function getPostStayMenu(booking: Booking, bookingRoomId: string): GuestServiceCategory[] {
  return [
    {
      category: 'After your stay',
      description: 'Post-stay help within 14 days of checkout',
      items: [
        ticketItem(
          booking,
          bookingRoomId,
          'INVOICE_COPY',
          'Invoice / bill copy',
          'Certainly. We have noted your invoice copy request. Our team will share it shortly.',
          { tileTitle: 'Invoice copy', etaMinutes: 240 },
        ),
        ticketItem(
          booking,
          bookingRoomId,
          'LOST_AND_FOUND',
          'Left something behind',
          'Certainly. We have logged your lost-and-found request. Our team will check and get back to you.',
          { tileTitle: 'Lost & found', etaMinutes: 120 },
        ),
        ticketItem(
          booking,
          bookingRoomId,
          'POST_STAY_FEEDBACK',
          'Share feedback',
          'Thank you for your feedback. We appreciate you staying with us.',
          { tileTitle: 'Feedback', etaMinutes: 480 },
        ),
        ticketItem(
          booking,
          bookingRoomId,
          'DEPARTURE_TRANSFER',
          'Departure transfer',
          'Certainly. We have noted your departure transfer request. Our team will confirm details shortly.',
          { tileTitle: 'Departure transfer', etaMinutes: 60 },
        ),
      ],
    },
  ]
}
