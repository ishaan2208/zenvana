import { isAnalyticsEventName } from '@/lib/analytics/events'

type Properties = Record<string, unknown>

type QueuedEvent = {
  name: string
  eventId: string
  properties?: Properties
  propertySlug?: string | null
  occurredAt: string
}

const ENDPOINT = '/api/track'
const FLUSH_INTERVAL_MS = 5_000
const MAX_QUEUE = 50
const RETRY_STORAGE_KEY = 'zenvana_analytics_retry_queue_v1'
const MAX_RETRY_QUEUE = 300

let queue: QueuedEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let listenersInstalled = false
let retryLoaded = false

function generateEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function readRetryQueue(): QueuedEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(RETRY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => item as QueuedEvent)
      .filter(
        (item) =>
          typeof item.name === 'string' &&
          typeof item.eventId === 'string' &&
          typeof item.occurredAt === 'string',
      )
      .slice(-MAX_RETRY_QUEUE)
  } catch {
    return []
  }
}

function writeRetryQueue(events: QueuedEvent[]): void {
  if (typeof window === 'undefined') return
  try {
    if (!events.length) {
      window.sessionStorage.removeItem(RETRY_STORAGE_KEY)
      return
    }
    window.sessionStorage.setItem(RETRY_STORAGE_KEY, JSON.stringify(events.slice(-MAX_RETRY_QUEUE)))
  } catch {
    /* ignore quota and private mode failures */
  }
}

function loadRetryQueueOnce(): void {
  if (retryLoaded || typeof window === 'undefined') return
  retryLoaded = true
  const persisted = readRetryQueue()
  if (!persisted.length) return
  queue = [...persisted, ...queue].slice(-MAX_RETRY_QUEUE)
  writeRetryQueue([])
}

function installLifecycleListeners() {
  if (listenersInstalled || typeof window === 'undefined') return
  listenersInstalled = true
  loadRetryQueueOnce()

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush({ synchronous: true })
    }
  })
  window.addEventListener('pagehide', () => flush({ synchronous: true }))
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flush({ synchronous: false })
  }, FLUSH_INTERVAL_MS)
}

function flush({ synchronous }: { synchronous: boolean }) {
  if (typeof window === 'undefined') return
  loadRetryQueueOnce()
  if (queue.length === 0) return
  const batch = queue.splice(0, MAX_QUEUE)
  const payload = JSON.stringify({ events: batch })

  if (synchronous && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([payload], { type: 'application/json' })
      const ok = navigator.sendBeacon(ENDPOINT, blob)
      if (ok) return
    } catch {
      /* fall through to fetch */
    }
  }

  try {
    const request = fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
      credentials: 'same-origin',
    })
    void request
      .then((res) => {
        if (!res.ok) {
          writeRetryQueue([...readRetryQueue(), ...batch])
        }
      })
      .catch(() => {
        writeRetryQueue([...readRetryQueue(), ...batch])
      })
  } catch {
    writeRetryQueue([...readRetryQueue(), ...batch])
  }
}

/**
 * Queue a client-side event. Safe to call from any client component or hook.
 * Events are flushed on a 5s timer, on tab hide, and on page unload.
 */
export function track(name: string, properties?: Properties, propertySlug?: string | null): void {
  if (typeof window === 'undefined') return
  if (!isAnalyticsEventName(name)) {
    console.warn('[analytics] invalid event name:', name)
    return
  }
  loadRetryQueueOnce()
  installLifecycleListeners()
  queue.push({
    name,
    eventId: generateEventId(),
    properties,
    propertySlug: propertySlug ?? null,
    occurredAt: new Date().toISOString(),
  })
  if (queue.length >= MAX_QUEUE) {
    flush({ synchronous: false })
    return
  }
  scheduleFlush()
}

/** For tests / debugging — flush the queue immediately. */
export function flushNow(): void {
  flush({ synchronous: false })
}
