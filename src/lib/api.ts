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

export type PublicHourlyStaySummary = {
  enabled: boolean
  windowStart: string
  windowEnd: string
  durationsHours: number[]
  basePercentOfNight?: number
  baseDurationHours?: number
  floorPrice?: number
}

export type PublicPropertyListItem = {
  id: number
  slug: string
  publicName: string
  city: string | null
  state: string | null
  shortDescription?: string
  heroImageUrl?: string
  fullAddress?: string
  landmarks?: unknown
  latitude?: number
  longitude?: number
  canonicalUrl?: string
  /** Hotels grid: show “Great value” pill when true (from PropertyPublicProfile). */
  showValueBadge?: boolean
  hourlyStayEnabled?: boolean
  hourlyStay?: PublicHourlyStaySummary
}

export type PublicListingPriceEntry = {
  totalAmount: number
  totalMarketAmount?: number
} | null

export type PublicPropertiesListingResponse = {
  checkIn: string
  checkOut: string
  currency: string
  properties: PublicPropertyListItem[]
  listingPriceBySlug: Record<string, PublicListingPriceEntry>
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
  showValueBadge?: boolean
  nearbyPlaces?: Array<{
    name: string
    category: string
    kind: 'transit' | 'nearby'
    lat?: number
    lng?: number
    distanceKm?: number
    driveTime?: string
  }>
  seoTitle?: string
  seoDescription?: string
  ogImageUrl?: string
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
  hourlyStayEnabled?: boolean
  hourlyStay?: PublicHourlyStaySummary
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

export async function getPublicPropertiesListing(
  checkIn: string,
  checkOut: string,
  occupancy?: number,
): Promise<PublicPropertiesListingResponse | null> {
  try {
    const params = new URLSearchParams({ checkIn, checkOut })
    if (occupancy != null) params.set('occupancy', String(occupancy))
    const res = await fetch(`${BACKEND_URL}/public/properties/listing?${params}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const json = await res.json()
    const data = json?.data
    if (!data?.properties || typeof data.listingPriceBySlug !== 'object') return null
    return data as PublicPropertiesListingResponse
  } catch {
    return null
  }
}

export async function getPublicPropertyBySlug(
  slug: string
): Promise<PublicPropertyDetail | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}`, {
      // Keep in sync with listing (getPublicProperties) so new public fields (e.g. badges) aren’t stale for 60s.
      next: { revalidate: 10 },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? null
  } catch {
    return null
  }
}

/**
 * Public bookings count for a given user/owner. Used by the homepage trust
 * strip to render a live scoreboard-style number.
 *
 * Backend endpoint contract (adjust if your backend exposes a different path):
 *   GET /api/v1/public/stats/bookings?userId=1
 *   → { count: number } | { bookingCount: number } | { data: { count: number } }
 *
 * Returns null on any failure so the UI can fall back to a static label.
 */
export async function getPublicBookingsCount(
  userId: number,
  options: { revalidate?: number } = {},
): Promise<number | null> {
  try {
    const url = `${BACKEND_URL}/public/stats/bookings?userId=${encodeURIComponent(userId)}`
    const res = await fetch(url, {
      next: { revalidate: options.revalidate ?? 60 },
    })
    if (!res.ok) return null
    const json = await res.json()
    const pick = (v: unknown) =>
      typeof v === 'number' && Number.isFinite(v) ? v : null
    const candidate =
      pick(json?.count) ??
      pick(json?.bookingCount) ??
      pick(json?.data?.count) ??
      pick(json?.data?.bookingCount)
    return candidate
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

export type PublicOffer = {
  code: string
  title: string
  imageUrl?: string | null
  discountType: 'FLAT' | 'PERCENT' | string
  discountValue: number
  maxDiscount?: number | null
  minBookingAmount?: number | null
  minRoomNights?: number | null
  loginRequired?: boolean
  scopeType: 'GLOBAL' | 'PROPERTY' | string
  validUntil?: string | null
  properties?: Array<{ name: string; slug: string }>
}

export async function getPublicOffers(): Promise<PublicOffer[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/public/offers`, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    return json?.data ?? []
  } catch {
    return []
  }
}

/** POST contact form (browser). Sends mail via backend SMTP. */
export async function submitPublicContact(payload: {
  name: string
  email: string
  phone: string
  message: string
  /** Honeypot — leave empty */
  website?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/public/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
    if (!res.ok || !json.ok) {
      return { ok: false, error: json?.error ?? 'Something went wrong. Please try again.' }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Network error. Please check your connection and try again.' }
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
  perNightRates?: Array<{ date: string; directRate: number; marketRate: number }>
  averagePricePerNight: number
  averageMarketRatePerNight?: number
  totalAmount: number
  totalMarketAmount?: number
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
  perNightRates: Array<{ date: string; directRate: number; marketRate: number }>
  averagePricePerNight: number
  averageMarketRatePerNight?: number
  totalAmount: number
  totalMarketAmount?: number
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
  occupancy?: number,
  fetchInit?: { next?: { revalidate?: number | false } }
): Promise<PublicRatesBulkResponse | null> {
  const params = new URLSearchParams({ checkIn, checkOut })
  if (occupancy != null) params.set('occupancy', String(occupancy))
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/rates/bulk?${params}`,
    fetchInit?.next ? { next: fetchInit.next } : undefined
  )
  if (!res.ok) return null
  const json = await res.json()
  return json?.data ?? null
}

/** Lowest average direct rate per night across room types (for listing “from” labels). */
export function minAverageNightFromBulk(data: PublicRatesBulkResponse | null): number | null {
  if (!data?.roomTypes?.length) return null
  let min = Infinity
  for (const rt of data.roomTypes) {
    const n = rt.averagePricePerNight
    if (typeof n === 'number' && n > 0 && n < min) min = n
  }
  return min === Infinity ? null : min
}

/**
 * Cheapest rate-plan row (minimum direct stay total) across all room types and meal plans.
 * Matches book flow totals: plan.totalAmount / plan.marketTotalAmount with occupancy as fetched.
 */
export function cheapestPlanAcrossRoomTypes(
  perRoomType: Array<PublicRatesWithPlansResponse | null>
): PublicRatesWithPlansPlan | null {
  let best: PublicRatesWithPlansPlan | null = null
  let bestTotal = Infinity
  for (const data of perRoomType) {
    if (!data || data.noRatePlanForOccupancy) continue
    for (const p of data.plans ?? []) {
      const t = p.totalAmount
      if (typeof t !== 'number' || !(t > 0)) continue
      if (t < bestTotal) {
        bestTotal = t
        best = p
      }
    }
  }
  return best
}

/** Fallback when no plan rows: lowest direct stay total from bulk engine (same dates). */
export function cheapestStayFromBulk(
  data: PublicRatesBulkResponse | null
): { totalAmount: number; totalMarketAmount?: number } | null {
  if (!data?.roomTypes?.length) return null
  let best: { totalAmount: number; totalMarketAmount?: number } | null = null
  let bestTotal = Infinity
  for (const rt of data.roomTypes) {
    const t = rt.totalAmount
    if (typeof t !== 'number' || !(t > 0)) continue
    if (t < bestTotal) {
      bestTotal = t
      best = {
        totalAmount: t,
        totalMarketAmount: rt.totalMarketAmount,
      }
    }
  }
  return best
}

export type PublicRatesWithPlansPlan = {
  plan: string
  planCode?: string
  label: string
  totalAmount: number
  marketTotalAmount?: number
  averagePricePerNight: number
  averageMarketRatePerNight?: number
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
  baseMarketTotal?: number
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
  occupancy?: number,
  fetchInit?: { next?: { revalidate?: number | false } }
): Promise<PublicRatesWithPlansResponse | null> {
  const params = new URLSearchParams({
    roomTypeId: String(roomTypeId),
    checkIn,
    checkOut,
  })
  if (occupancy != null) params.set('occupancy', String(occupancy))
  const url = `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/rates/plans?${params}`
  const res = await fetch(url, fetchInit?.next ? { next: fetchInit.next } : undefined)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.log('[zenvana/api] getPublicRatesWithPlans failed', {
      url,
      status: res.status,
      ok: res.ok,
      error: json?.error ?? json?.message,
    })
    return null
  }
  const data = json?.data ?? null
  if (data == null) {
    console.log('[zenvana/api] getPublicRatesWithPlans empty data', { url, json: json?.data })
  }
  return data
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
  ratePlanId?: number
  // Backward compatibility alias used by some checkout paths
  ratePlan?: string
  couponCode?: string
  pointsToRedeem?: number
  payment?: { paid: boolean; transactionId?: string }
}

export type CreatePublicHourlyBookingPayload = {
  stayKind: 'HOURLY'
  guestName: string
  guestPhone: string
  guestEmail?: string
  date: string
  startTime: string
  durationHours: number
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
  stayKind?: string
  date?: string
  startTime?: string
  durationHours?: number
  plannedCheckInAt?: string
  plannedCheckOutAt?: string
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
      credentials: 'include',
      body: JSON.stringify(payload),
    }
  )
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json?.error ?? json?.message ?? 'Booking failed')
  }
  return json?.data
}

export async function createPublicHourlyBooking(
  slug: string,
  payload: CreatePublicHourlyBookingPayload
): Promise<CreatePublicBookingResponse> {
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/booking`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    }
  )
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json?.error ?? json?.message ?? 'Booking failed')
  }
  return json?.data
}

export type PublicHourlyAvailabilityResponse = {
  date: string
  startTime: string
  durationHours: number
  plannedCheckInAt: string
  plannedCheckOutAt: string
  roomTypes: Array<{ roomTypeId: number; name: string; available: number }>
}

export async function getPublicHourlyAvailability(
  slug: string,
  date: string,
  startTime: string,
  durationHours: number
): Promise<PublicHourlyAvailabilityResponse | null> {
  try {
    const params = new URLSearchParams({
      date,
      startTime,
      durationHours: String(durationHours),
    })
    const res = await fetch(
      `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/hourly/availability?${params}`,
      { next: { revalidate: 0 } }
    )
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? null
  } catch {
    return null
  }
}

export type PublicHourlyQuote = {
  price: number
  directNightRate: number
  available: number
  plannedCheckInAt: string
  plannedCheckOutAt: string
  durationHours: number
}

export async function getPublicHourlyQuote(
  slug: string,
  params: {
    date: string
    startTime: string
    durationHours: number
    roomTypeId: number
  }
): Promise<PublicHourlyQuote | null> {
  try {
    const qs = new URLSearchParams({
      date: params.date,
      startTime: params.startTime,
      durationHours: String(params.durationHours),
      roomTypeId: String(params.roomTypeId),
    })
    const res = await fetch(
      `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/hourly/quote?${qs}`,
      { next: { revalidate: 0 } }
    )
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? null
  } catch {
    return null
  }
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
    couponCode?: string
    pointsToRedeem?: number
  }
): Promise<CreatePublicBookingResponse> {
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/booking`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    }
  )
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json?.error ?? json?.message ?? 'Booking failed')
  }
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
  couponCode?: string
  pointsToRedeem?: number
}

// -----------------------------------------------------------------------------
// Razorpay (pay_now flow)
// -----------------------------------------------------------------------------

/** Server computes paise from `booking` and stores a pending checkout row for webhooks. */
export async function createRazorpayOrder(
  slug: string,
  booking: PublicBookingPayload,
  opts?: { currency?: string; receipt?: string; pointsToRedeem?: number }
): Promise<{ orderId: string; cashPaise: number; pointsRedeemed: number }> {
  const currency = opts?.currency ?? 'INR'
  const receipt = opts?.receipt
  const pointsToRedeem = opts?.pointsToRedeem ?? 0
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/booking/razorpay-order`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        booking: { ...booking, pointsToRedeem },
        currency,
        receipt,
        pointsToRedeem,
      }),
    }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error ?? json?.message ?? 'Could not create payment order')
  return json?.data
}

export async function validatePublicBookingCoupon(
  slug: string,
  booking: PublicBookingPayload
): Promise<{
  valid: boolean
  code?: string
  discountAmount: number
  subtotal: number
  payable: number
  reason?: string
  message?: string
}> {
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/booking/coupon/validate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(booking),
    }
  )
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.message ?? json?.error ?? 'Coupon validation failed')
  return json?.data
}

export type PublicVoucherBookingRoom = {
  id: number
  occupancy: number
  roomPlan?: 'EP' | 'CP' | 'MAP' | 'AP'
  tariff: number
  totalNight: number
  checkInDate: string
  checkOutDate: string
  /** @deprecated Use checkInDate */
  checkIn?: string | null
  /** @deprecated Use checkOutDate */
  checkOut?: string | null
  room_type: { name: string }
}

export type PublicVoucherBookingDetails = {
  id: number
  guestName: string
  company: string | null
  guestPhoneNumber: string
  email: string | null
  address: string | null
  gstNumber: string | null
  totalRooms: number
  remarks: string | null
  source: string
  totalAmount: number
  totalPaid: number
  createdAt: string
  bookingReference: string
  BookingRoom: PublicVoucherBookingRoom[]
  property: {
    name: string
    address: string | null
    city: string | null
    pincode: string | null
    phone: string | null
    email: string | null
    logoUrl: string | null
  }
}

export async function getPublicBookingVoucherDetails(
  slug: string,
  bookingReference: string
): Promise<PublicVoucherBookingDetails> {
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/booking/by-reference/${encodeURIComponent(bookingReference)}`,
    { method: 'GET', credentials: 'include' }
  )
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json?.error ?? json?.message ?? 'Failed to fetch booking voucher details')
  }
  return json?.data
}

export async function getPublicBookingVoucherDetailsByReference(
  bookingReference: string
): Promise<PublicVoucherBookingDetails> {
  const res = await fetch(
    `${BACKEND_URL}/public/booking/by-reference/${encodeURIComponent(bookingReference)}`,
    { method: 'GET', credentials: 'include' }
  )
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json?.error ?? json?.message ?? 'Failed to fetch booking voucher details')
  }
  return json?.data
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
      credentials: 'include',
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

export async function sendPublicBookingOtp(
  slug: string,
  phone: string
): Promise<{ expiresAt: string; maskedPhone?: string }> {
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/booking/otp/send`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ phone }),
    }
  )
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json?.message ?? json?.error ?? 'Failed to send OTP')
  }
  return {
    expiresAt: json?.expiresAt,
    maskedPhone: json?.maskedPhone,
  }
}

export async function verifyPublicBookingOtp(
  slug: string,
  phone: string,
  otp: string
): Promise<{ verifiedAt: string }> {
  const res = await fetch(
    `${BACKEND_URL}/public/properties/${encodeURIComponent(slug)}/booking/otp/verify`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ phone, otp }),
    }
  )
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (json?.error === 'INVALID_OTP' && typeof json?.attemptsRemaining === 'number') {
      throw new Error(`Invalid OTP. ${json.attemptsRemaining} attempts remaining.`)
    }
    throw new Error(json?.message ?? json?.error ?? 'OTP verification failed')
  }
  return { verifiedAt: json?.verifiedAt }
}
