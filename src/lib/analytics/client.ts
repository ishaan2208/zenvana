type Properties = Record<string, unknown>

type QueuedEvent = {
  name: string
  properties?: Properties
  propertySlug?: string | null
  occurredAt: string
}

const ENDPOINT = '/api/track'
const FLUSH_INTERVAL_MS = 5_000
const MAX_QUEUE = 50

let queue: QueuedEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let listenersInstalled = false

function installLifecycleListeners() {
  if (listenersInstalled || typeof window === 'undefined') return
  listenersInstalled = true

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
  if (queue.length === 0) return
  const payload = JSON.stringify({ events: queue.splice(0, MAX_QUEUE) })

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
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
      credentials: 'same-origin',
    })
  } catch {
    /* drop silently — analytics must never break the app */
  }
}

/**
 * Queue a client-side event. Safe to call from any client component or hook.
 * Events are flushed on a 5s timer, on tab hide, and on page unload.
 */
export function track(name: string, properties?: Properties, propertySlug?: string | null): void {
  if (typeof window === 'undefined') return
  if (!/^[a-z0-9_]{1,64}$/.test(name)) {
    console.warn('[analytics] invalid event name:', name)
    return
  }
  installLifecycleListeners()
  queue.push({
    name,
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
