/**
 * Calendar YYYY-MM-DD in Asia/Kolkata (IST, no DST) — matches how guests think about “today”.
 */
export function kolkataYmd(d = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const y = parts.find((p) => p.type === 'year')?.value ?? ''
  const m = (parts.find((p) => p.type === 'month')?.value ?? '').padStart(2, '0')
  const day = (parts.find((p) => p.type === 'day')?.value ?? '').padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Add whole calendar days to a YYYY-MM-DD string (UTC date math; safe for IST). */
export function addDaysYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const t = Date.UTC(y, m - 1, d + deltaDays)
  return new Date(t).toISOString().slice(0, 10)
}
