'use client'

import axios from '@/features/guest-assistant/lib/axios.config'
import type { Booking } from '@/features/guest-assistant/types/booking.types'

export async function createTicketFromItem(
  item: { type: string; isChargeable?: boolean; details?: string },
  ctx: {
    propertyId: number
    bookingId?: number | null
    roomId?: number | null
    guestId?: number | null
    bookingRoomId?: number | string | null
  },
) {
  const idempotencyKey = crypto.randomUUID()
  const res = await axios.post(
    '/chatbot/reply',
    {
      type: item.type,
      isPaid: !!item.isChargeable,
      details: item.details,
      idempotencyKey,
      context: { ...ctx, channel: 'CHATBOT' },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
    },
  )
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Ticket create failed: ${res.status}`)
  }
  return res.data
}

type FoodFulfillmentKind = 'ROOM_SERVICE' | 'TABLE' | 'DELIVERY' | 'TAKEAWAY'

export const FOOD_APP_BASE_URL =
  process.env.NEXT_PUBLIC_FOOD_APP_URL ?? 'https://feasta.stayzenvana.com'

function buildFoodCheckoutUrl(
  path: string,
  params: Record<string, string | number | undefined | null>,
) {
  const url = new URL(path, FOOD_APP_BASE_URL)
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function resolveRestaurantId(booking: Booking): number | undefined {
  const fromSubUser = (booking as { subUser?: { restaurantId?: number } })?.subUser
    ?.restaurantId
  if (typeof fromSubUser === 'number' && Number.isFinite(fromSubUser)) {
    return fromSubUser
  }
  const fromOrders = booking.orders?.[0]?.restaurantId
  if (typeof fromOrders === 'number' && Number.isFinite(fromOrders)) {
    return fromOrders
  }
  return undefined
}

export async function openFoodOrderFromChatbot(input: {
  booking: Booking
  bookingRoomId?: string | null
  kind?: FoodFulfillmentKind
}) {
  const { booking, bookingRoomId, kind = 'ROOM_SERVICE' } = input
  const selectedRoom = booking?.BookingRoom?.find(
    (room) => String(room.id) === String(bookingRoomId ?? ''),
  )
  const fallbackRoom = selectedRoom ?? booking?.BookingRoom?.[0]
  const restaurantId = resolveRestaurantId(booking)

  const fallbackUrl = buildFoodCheckoutUrl('/checkout', {
    pid: restaurantId,
    phone: booking?.guestPhoneNumber,
    name: booking?.guestName,
    bookingId: booking?.id,
    bookingRoomId: fallbackRoom?.id,
    room: fallbackRoom?.roomNumber,
    propertyId: booking?.propertyId,
    kind,
    src: 'chatbot',
  })

  try {
    const res = await axios.post('/chatbot/food-handoff/mint', {
      bookingId: booking.id,
      phoneNumber: booking.guestPhoneNumber,
      bookingRoomId: fallbackRoom?.id,
      restaurantId,
      kind,
    })
    const token = res?.data?.data?.token as string | undefined
    if (!token) {
      window.open(fallbackUrl, '_blank')
      return fallbackUrl
    }
    const handoffUrl = buildFoodCheckoutUrl('/checkout', {
      pid: restaurantId,
      handoff: token,
      src: 'chatbot',
    })
    window.open(handoffUrl, '_blank')
    return handoffUrl
  } catch (error) {
    console.error('Food handoff mint failed, using query fallback', error)
    window.open(fallbackUrl, '_blank')
    return fallbackUrl
  }
}
