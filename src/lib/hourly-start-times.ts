/**
 * Hourly start-time options — window-aware and current-day time-aware (IST).
 */

const IST = 'Asia/Kolkata'

function hhMmToMinutes(hhMm: string): number {
  const [h, m] = hhMm.split(':').map(Number)
  return h * 60 + (m || 0)
}

function minutesToHhMm(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Calendar YYYY-MM-DD in Asia/Kolkata for a given instant. */
export function istYmd(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Minutes since midnight IST. */
export function istMinutesNow(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return hour * 60 + minute
}

/**
 * Earliest bookable start (minutes) for *today*: next 30-min boundary at/after now+1min.
 * Future dates: no floor (caller uses windowStart).
 */
export function earliestBookableStartMinutes(
  dateYmd: string,
  now: Date = new Date()
): number | null {
  if (dateYmd !== istYmd(now)) return null
  const mins = istMinutesNow(now) + 1
  return Math.ceil(mins / 30) * 30
}

/**
 * Start times where [start, start+duration] fits inside [windowStart, windowEnd],
 * and for today, start is not already in the past (IST).
 *
 * Example: window 10:00–22:00, duration 3h → last start 19:00 (not 20:00/21:00).
 * If now is 15:00 IST today → 10:00…14:30 dropped.
 */
export function buildHourlyStartTimeOptions(params: {
  windowStart: string
  windowEnd: string
  durationHours: number
  dateYmd?: string
  now?: Date
  stepMinutes?: number
}): string[] {
  const {
    windowStart,
    windowEnd,
    durationHours,
    dateYmd,
    now = new Date(),
    stepMinutes = 30,
  } = params

  const winStart = hhMmToMinutes(windowStart)
  const winEnd = hhMmToMinutes(windowEnd)
  const needed = durationHours * 60
  if (!(needed > 0) || winEnd <= winStart) return []

  const earliestToday =
    dateYmd != null ? earliestBookableStartMinutes(dateYmd, now) : null
  const floor = earliestToday != null ? Math.max(winStart, earliestToday) : winStart

  const opts: string[] = []
  for (let t = winStart; t + needed <= winEnd; t += stepMinutes) {
    if (t < floor) continue
    opts.push(minutesToHhMm(t))
  }
  return opts
}
