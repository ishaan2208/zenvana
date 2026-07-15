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
  const floor =
    earliestToday != null ? Math.max(winStart, earliestToday) : winStart

  const opts: string[] = []
  for (let t = winStart; t + needed <= winEnd; t += stepMinutes) {
    if (t < floor) continue
    opts.push(minutesToHhMm(t))
  }
  return opts
}

/**
 * Next bookable start for the given day/window/duration.
 * Keeps `current` if still valid; otherwise returns the earliest remaining slot.
 */
export function nextHourlyStartTime(params: {
  windowStart: string
  windowEnd: string
  durationHours: number
  dateYmd: string
  now?: Date
  current?: string | null
  forceEarliest?: boolean
}): string | null {
  const options = buildHourlyStartTimeOptions(params)
  if (options.length === 0) return null
  if (
    !params.forceEarliest &&
    params.current &&
    options.includes(params.current)
  ) {
    return params.current
  }
  return options[0] ?? null
}

/** Local calendar YYYY-MM-DD (browser local — matches date pickers). */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
