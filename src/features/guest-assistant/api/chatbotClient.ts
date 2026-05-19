const apiBase = () => {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
  const trimmed = base.replace(/\/$/, '')
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`
}

export async function fetchStayContext(bookingId: number, phoneNumber: string) {
  const url = new URL(`${apiBase()}/chatbot/stay-context`)
  url.searchParams.set('bookingId', String(bookingId))
  url.searchParams.set('phoneNumber', phoneNumber)
  const res = await fetch(url.toString())
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message ?? 'Failed to load stay')
  return json.data as {
    booking: unknown
    phase: string
    slug: string | null
  }
}
