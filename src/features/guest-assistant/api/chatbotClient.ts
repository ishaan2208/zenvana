const apiBase = () => {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
  const trimmed = base.replace(/\/$/, '')
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`
}

export type ChatbotGuestData = {
  id: number
  guestPhoneNumber: string
  guestName?: string
  bookingRoomId?: number
  roomNumber?: string
  selectedRoomId?: number
  BookingRoom?: Array<{
    checkInDate?: string | null
    checkOutDate?: string | null
    checkIn?: string | null
    checkOut?: string | null
  }>
}

async function parseJson(res: Response) {
  return res.json().catch(() => ({}))
}

export async function fetchStayContext(bookingId: number, phoneNumber: string) {
  const url = new URL(`${apiBase()}/chatbot/stay-context`)
  url.searchParams.set('bookingId', String(bookingId))
  url.searchParams.set('phoneNumber', phoneNumber)
  const res = await fetch(url.toString())
  const json = await parseJson(res)
  if (!res.ok) throw new Error(json?.message ?? 'Failed to load stay')
  return json.data as {
    booking: unknown
    phase: string
    slug: string | null
  }
}

export async function postChatbotLogin(phoneNumber: string): Promise<ChatbotGuestData> {
  const res = await fetch(`${apiBase()}/chatbot/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  })
  const json = await parseJson(res)
  if (!res.ok) {
    const msg =
      res.status === 404
        ? 'No active booking found for this phone number.'
        : (json?.message ?? 'Login failed')
    throw new Error(msg)
  }
  return json.data as ChatbotGuestData
}

export async function fetchGuestByRoom(params: {
  bookingRoomId?: string
  roomId?: string
}): Promise<ChatbotGuestData> {
  const url = new URL(`${apiBase()}/chatbot/guest-by-room`)
  if (params.bookingRoomId) {
    url.searchParams.set('bookingRoomId', params.bookingRoomId)
  } else if (params.roomId) {
    url.searchParams.set('roomId', params.roomId)
  }
  const res = await fetch(url.toString())
  const json = await parseJson(res)
  if (!res.ok) {
    const msg =
      res.status === 404
        ? 'No current stay found for this room. Please use your phone number to sign in.'
        : (json?.message ?? 'QR sign-in failed')
    throw new Error(msg)
  }
  return json.data as ChatbotGuestData
}
