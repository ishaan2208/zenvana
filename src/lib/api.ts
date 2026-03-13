/**
 * Fetch from backend public API. Used by server components and static generation.
 * Backend mounts at /api/v1, so we always use .../api/v1/public/...
 */

function getBackendBase(): string {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
  const trimmed = base.replace(/\/$/, '')
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`
}

const BACKEND_URL = getBackendBase()

export type PublicPropertyListItem = {
  id: number
  slug: string
  publicName: string
  city: string | null
  state: string | null
  shortDescription?: string
  heroImageUrl?: string
  canonicalUrl?: string
}

export type PublicPropertyDetail = {
  id: number
  slug: string
  publicName: string
  brandName?: string
  shortName?: string
  fullAddress?: string
  city?: string
  state?: string
  country?: string
  latitude?: number
  longitude?: number
  primaryPhone?: string
  whatsappPhone?: string
  email?: string
  images?: unknown
  descriptionShort?: string
  descriptionLong?: string
  amenities?: unknown
  landmarks?: unknown
  checkInTime?: string
  checkOutTime?: string
  policies?: string
  reviewSummary?: unknown
  gbpUrl?: string
  googleMapPlaceUrl?: string
  canonicalUrl?: string
  roomTypes: Array<{
    id: number
    name: string
    slug: string | null
    shortDescription: string | null
    occupancy: string | null
    bedType: string | null
    areaSqft: number | null
    images: unknown
    amenities: unknown
    seoDescription: string | null
    basePrice: number
    floorPrice: number
    ceilPrice: number
  }>
  faqs: Array<{ id: number; question: string; answer: string; sortOrder: number }>
}

export async function getPublicProperties(): Promise<PublicPropertyListItem[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/public/properties`, {
      next: { revalidate: 10 }, // shorter cache so new images show soon after save
    })
    if (!res.ok) return []
    const json = await res.json()
    return json?.data ?? []
  } catch {
    return []
  }
}

export async function getPublicPropertyBySlug(
  slug: string
): Promise<PublicPropertyDetail | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? null
  } catch {
    return null
  }
}

export async function getPublicDestinations(): Promise<
  Array<{ city: string; propertyCount: number }>
> {
  try {
    const res = await fetch(`${BACKEND_URL}/public/destinations`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json?.data ?? []
  } catch {
    return []
  }
}

// Client-side: availability and rates (called with user-selected dates)

export type PublicAvailabilityRoomType = {
  roomTypeId: number
  name: string
  occupancy: string | null
  availableRooms: number
  nights: number
}

export type PublicAvailabilityResponse = {
  checkIn: string
  checkOut: string
  nights: number
  roomTypes: PublicAvailabilityRoomType[]
}

export async function getPublicAvailability(
  slug: string,
  checkIn: string,
  checkOut: string
): Promise<PublicAvailabilityResponse | null> {
  const params = new URLSearchParams({ checkIn, checkOut })
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/availability?${params}`
  )
  if (!res.ok) return null
  const json = await res.json()
  return json?.data ?? null
}

export type PublicRatesResponse = {
  roomTypeId: number
  roomTypeName: string
  checkIn: string
  checkOut: string
  nights: number
  perNightRates?: Array<{ date: string; directRate: number }>
  averagePricePerNight: number
  totalAmount: number
  currency: string
}

export async function getPublicRates(
  slug: string,
  roomTypeId: number,
  checkIn: string,
  checkOut: string
): Promise<PublicRatesResponse | null> {
  const params = new URLSearchParams({
    roomTypeId: String(roomTypeId),
    checkIn,
    checkOut,
  })
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/rates?${params}`
  )
  if (!res.ok) return null
  const json = await res.json()
  return json?.data ?? null
}

export type PublicRatesBulkRoomType = {
  roomTypeId: number
  roomTypeName: string
  nights: number
  perNightRates: Array<{ date: string; directRate: number }>
  averagePricePerNight: number
  totalAmount: number
}

export type PublicRatesBulkResponse = {
  checkIn: string
  checkOut: string
  nights: number
  roomTypes: PublicRatesBulkRoomType[]
  currency: string
}

export async function getPublicRatesBulk(
  slug: string,
  checkIn: string,
  checkOut: string,
  occupancy?: number
): Promise<PublicRatesBulkResponse | null> {
  const params = new URLSearchParams({ checkIn, checkOut })
  if (occupancy != null) params.set('occupancy', String(occupancy))
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/rates/bulk?${params}`
  )
  if (!res.ok) return null
  const json = await res.json()
  return json?.data ?? null
}

export type PublicRatesWithPlansPlan = {
  plan: string
  planCode?: string
  label: string
  totalAmount: number
  averagePricePerNight: number
  /** EP | CP | MAP | AP — same plan type must be used for all rooms in multi-room booking */
  mealPlan?: string
}

export type PublicRatesWithPlansResponse = {
  roomTypeId: number
  roomTypeName: string
  checkIn: string
  checkOut: string
  nights: number
  occupancy: number | null
  baseDirectTotal: number
  plans: PublicRatesWithPlansPlan[]
  /** True when occupancy was requested but no rate plans exist for that guest count (show sold out). */
  noRatePlanForOccupancy?: boolean
  currency: string
}

export async function getPublicRatesWithPlans(
  slug: string,
  roomTypeId: number,
  checkIn: string,
  checkOut: string,
  occupancy?: number
): Promise<PublicRatesWithPlansResponse | null> {
  const params = new URLSearchParams({
    roomTypeId: String(roomTypeId),
    checkIn,
    checkOut,
  })
  if (occupancy != null) params.set('occupancy', String(occupancy))
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/rates/plans?${params}`
  )
  if (!res.ok) return null
  const json = await res.json()
  return json?.data ?? null
}

// -----------------------------------------------------------------------------
// Public booking creation (PMS booking at confirmation)
// -----------------------------------------------------------------------------

export type CreatePublicBookingPayload = {
  guestName: string
  guestPhone: string
  guestEmail?: string
  checkIn: string
  checkOut: string
  roomTypeId: number
  totalAmount: number
  occupancy?: number
  payment?: { paid: boolean; transactionId?: string }
}

export type CreatePublicBookingResponse = {
  bookingId: number
  bookingReference: string
  guestName: string
  checkIn: string
  checkOut: string
  totalAmount: number
  totalPaid: number
}

/** Call from client (e.g. CheckoutForm). Creates PMS booking at confirmation (legacy single-room). */
export async function createPublicBooking(
  slug: string,
  payload: CreatePublicBookingPayload
): Promise<CreatePublicBookingResponse> {
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/booking`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json?.error ?? json?.message ?? 'Booking failed')
  }
  return json?.data
}

/** Multi-room: create booking with roomLines (one line per room). Pay now uses Razorpay flow. */
export async function createPublicBookingWithRoomLines(
  slug: string,
  payload: {
    guest: { name: string; phone: string; email?: string }
    checkIn: string
    checkOut: string
    roomLines: Array<{ roomTypeId: number; ratePlanId?: number; occupancy: number; tariff: number }>
    paymentIntent: 'pay_later' | 'pay_now'
  }
): Promise<CreatePublicBookingResponse> {
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/booking`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json?.error ?? json?.message ?? 'Booking failed')
  }
  return json?.data
}

// -----------------------------------------------------------------------------
// Razorpay (pay_now flow)
// -----------------------------------------------------------------------------

export async function createRazorpayOrder(
  slug: string,
  amountPaise: number,
  currency = 'INR',
  receipt?: string
): Promise<{ orderId: string }> {
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/booking/razorpay-order`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountPaise, currency, receipt }),
    }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error ?? 'Could not create payment order')
  return json?.data
}

export type PublicBookingPayload = {
  guest: { name: string; phone: string; email?: string }
  checkIn: string
  checkOut: string
  roomLines: Array<{
    roomTypeId: number
    ratePlanId?: number
    occupancy: number
    tariff: number
  }>
  paymentIntent: 'pay_later' | 'pay_now'
}

export async function verifyRazorpayAndCreateBooking(
  slug: string,
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  booking: PublicBookingPayload
): Promise<CreatePublicBookingResponse> {
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/booking/razorpay-verify`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        booking,
      }),
    }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error ?? 'Payment verification or booking failed')
  return json?.data
}
