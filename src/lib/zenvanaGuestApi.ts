function guestApiBase(): string {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
  const trimmed = base.replace(/\/$/, '')
  const withApi = trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`
  return `${withApi}/public/zenvana-guest`
}

export type ZenvanaGuestMe = {
  id: number
  phoneE164: string
  email: string | null
  emailVerifiedAt: string | null
  displayName: string | null
  createdAt: string
  pointsBalance: number
}

export async function getZenvanaGuestMe(): Promise<ZenvanaGuestMe | null> {
  const res = await fetch(`${guestApiBase()}/me`, {
    method: 'GET',
    credentials: 'include',
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return null
  return json?.data ?? null
}

export async function postZenvanaGuestLogout(): Promise<void> {
  await fetch(`${guestApiBase()}/session/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}

export async function postGuestSignupRequestOtp(phone: string): Promise<{
  challengeId: number
  expiresAt: string
  maskedPhone?: string
}> {
  const res = await fetch(`${guestApiBase()}/phone-otp/request-signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ phone }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error ?? json?.message ?? 'Could not send OTP')
  return json.data
}

export async function postGuestLoginRequestOtp(phone: string): Promise<{
  challengeId: number
  expiresAt: string
  maskedPhone?: string
}> {
  const res = await fetch(`${guestApiBase()}/phone-otp/request-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ phone }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error ?? json?.message ?? 'Could not send OTP')
  return json.data
}

export async function postGuestVerifySignup(
  phone: string,
  otp: string,
  challengeId: number
): Promise<void> {
  const res = await fetch(`${guestApiBase()}/phone-otp/verify-signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ phone, otp, challengeId }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error ?? json?.message ?? 'Verification failed')
}

export async function postGuestVerifyLogin(
  phone: string,
  otp: string,
  challengeId: number
): Promise<void> {
  const res = await fetch(`${guestApiBase()}/phone-otp/verify-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ phone, otp, challengeId }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error ?? json?.message ?? 'Verification failed')
}

export type ZenvanaGuestBookingRow = {
  id: number
  bookingReference: string
  guestName: string
  checkIn: string
  checkOut: string
  totalAmount: number
  bookingStatus: string
  propertyName: string
  slug: string | null
}

export async function getZenvanaGuestBookings(): Promise<ZenvanaGuestBookingRow[]> {
  const res = await fetch(`${guestApiBase()}/bookings`, { credentials: 'include' })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error ?? 'Could not load bookings')
  return json.data ?? []
}
