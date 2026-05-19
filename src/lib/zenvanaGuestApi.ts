function guestApiBase(): string {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
  const trimmed = base.replace(/\/$/, '')
  const withApi = trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`
  return `${withApi}/public/zenvana-guest`
}

export const ZENVANA_GUEST_TITLES = ['MR', 'MS', 'MRS'] as const
export type ZenvanaGuestTitle = (typeof ZENVANA_GUEST_TITLES)[number]

export type ZenvanaGuestMe = {
  id: number
  phoneE164: string
  email: string | null
  emailVerifiedAt: string | null
  title: ZenvanaGuestTitle | null
  firstName: string | null
  lastName: string | null
  displayName: string | null
  createdAt: string
  pointsBalance: number
}

export function zenvanaGuestTitleLabel(title: string | null | undefined): string {
  switch (title) {
    case 'MR':
      return 'Mr.'
    case 'MS':
      return 'Ms.'
    case 'MRS':
      return 'Mrs.'
    default:
      return ''
  }
}

/** Salutation + last name (e.g. Ms. Patel) for nav and greetings when we have both. */
export function formatZenvanaGuestSalutationName(me: {
  title?: string | null
  lastName?: string | null
  firstName?: string | null
  displayName?: string | null
}): string {
  const last = me.lastName?.trim() ?? ''
  const label = zenvanaGuestTitleLabel(me.title)
  if (label && last) return `${label} ${last}`
  return formatZenvanaGuestProfileName(me)
}

/** Full legal-style name: first + last, then legacy displayName. */
export function formatZenvanaGuestProfileName(me: {
  firstName?: string | null
  lastName?: string | null
  displayName?: string | null
}): string {
  const a = me.firstName?.trim() ?? ''
  const b = me.lastName?.trim() ?? ''
  const joined = [a, b].filter(Boolean).join(' ').trim()
  if (joined) return joined
  return (me.displayName?.trim() || '').trim()
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

export async function patchZenvanaGuestMe(body: {
  displayName?: string
  firstName?: string
  lastName?: string
  title?: ZenvanaGuestTitle
}): Promise<void> {
  const res = await fetch(`${guestApiBase()}/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      typeof json?.error === 'string'
        ? json.error
        : typeof json?.message === 'string'
          ? json.message
          : 'Could not update profile'
    throw new Error(msg)
  }
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
  challengeId: number,
  profile: { firstName: string; lastName: string; title: ZenvanaGuestTitle }
): Promise<void> {
  const res = await fetch(`${guestApiBase()}/phone-otp/verify-signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      phone,
      otp,
      challengeId,
      title: profile.title,
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
    }),
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

export async function checkGuestAccountExists(phone: string): Promise<boolean | null> {
  const normalized = phone.replace(/\D/g, '').slice(-10)
  if (normalized.length !== 10) return null
  try {
    const base = guestApiBase()
    const res = await fetch(`${base}/account-exists?phone=${encodeURIComponent(normalized)}`, {
      credentials: 'include',
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return null
    return Boolean(json?.data?.exists)
  } catch (error) {
    return null
  }
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

export async function fetchBookingStayContext(bookingId: number) {
  const res = await fetch(`${guestApiBase()}/bookings/${bookingId}/stay-context`, {
    credentials: 'include',
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error ?? 'Could not load stay context')
  return json.data as {
    booking: unknown
    phase: string
    phoneNumber: string
    slug: string | null
  }
}
