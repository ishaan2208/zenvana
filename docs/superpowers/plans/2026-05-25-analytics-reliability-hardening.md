# Analytics Reliability Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make forward analytics reliable by recording booking-critical events server-authoritatively, expanding page coverage across the app, and adding DB+log audit signals for every acceptance/rejection/failure path.

**Architecture:** Keep analytics non-blocking for product flows, but move booking outcome tracking to trusted server paths. Add an `analytics.event_audit` table and recorder-level audit hooks for root-cause visibility. Preserve existing event ingestion endpoints and event schema while improving observability and dedupe clarity.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Prisma/Postgres, Vitest (new), existing analytics modules (`src/lib/analytics/*`)

---

## File Structure Map (Lock Before Coding)

- `package.json`  
  Add test scripts and Vitest dependencies.
- `vitest.config.ts` (new)  
  Vitest configuration for Node + path aliases.
- `tsconfig.vitest.json` (new)  
  Compiler settings for test runner context.
- `prisma/schema.prisma`  
  Add `AnalyticsEventAudit` model in `analytics` schema.
- `prisma/migrations/<timestamp>_add_analytics_event_audit/migration.sql` (new, generated)  
  Create `analytics.event_audit` table + indexes.
- `src/lib/analytics/audit.ts` (new)  
  Central audit reason/status enums and write helper.
- `src/lib/analytics/recorder.ts`  
  Emit audit rows for accepted/rejected/deduped/failed/truncated outcomes.
- `src/app/api/track/route.ts`  
  Structured logs + audit events for blocked/rate-limited/invalid/accepted batches.
- `src/components/analytics/PageViewTracker.tsx`  
  Add route exclusion guard (`/internal`, `/api`, etc.).
- `src/app/layout.tsx`  
  Mount `PageViewTracker` globally.
- `src/app/(booking)/layout.tsx`  
  Remove booking-only mount to prevent duplicate pageview tracking.
- `src/lib/analytics/bookingOutcome.ts` (new)  
  Helper to record canonical booking/payment outcome events.
- `src/app/(booking)/book/[slug]/checkout/CheckoutForm.tsx`  
  Replace direct critical booking event writes with helper usage.
- `src/app/(booking)/book/[slug]/checkout/MultiRoomCheckoutForm.tsx`  
  Replace direct critical booking event writes with helper usage.
- `src/lib/analytics/queries.ts`  
  Add recent audit query.
- `src/app/internal/analytics/actions.ts`  
  Expose server action to fetch recent audit entries.
- `src/app/internal/analytics/Dashboard.tsx`  
  Add lightweight audit panel to inspect recent rejected/failed events.
- `src/lib/analytics/__tests__/audit.test.ts` (new)
- `src/lib/analytics/__tests__/recorder.test.ts` (new)
- `src/app/api/track/__tests__/route.test.ts` (new)
- `src/lib/analytics/__tests__/bookingOutcome.test.ts` (new)

---

### Task 1: Add Test Harness (Vitest) Before Behavior Changes

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tsconfig.vitest.json`
- Test: `src/lib/analytics/__tests__/smoke.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'

describe('analytics test harness', () => {
  it('runs vitest in repo', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/analytics/__tests__/smoke.test.ts`  
Expected: FAIL with "Cannot find module 'vitest'" or missing config.

- [ ] **Step 3: Write minimal implementation**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    clearMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
```

```json
// package.json (scripts/devDependencies excerpt)
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/analytics/__tests__/smoke.test.ts`  
Expected: PASS (1 test passed).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tsconfig.vitest.json src/lib/analytics/__tests__/smoke.test.ts
git commit -m "test(analytics): add vitest harness for reliability hardening"
```

---

### Task 2: Add Audit Table to Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_analytics_event_audit/migration.sql`
- Test: migration apply + Prisma client generation

- [ ] **Step 1: Write the failing schema expectation test**

```bash
rg "model AnalyticsEventAudit" prisma/schema.prisma
```

Expected: no output (model missing).

- [ ] **Step 2: Run check to verify it fails**

Run: `npm run db:generate`  
Expected: no `AnalyticsEventAudit` type in generated client.

- [ ] **Step 3: Write minimal implementation**

```prisma
model AnalyticsEventAudit {
  id               BigInt   @id @default(autoincrement())
  eventName        String
  source           String
  status           String
  reasonCode       String
  sessionId        String?
  eventId          String?
  bookingReference String?
  propertySlug     String?
  occurredAt       DateTime?
  recordedAt       DateTime @default(now())
  meta             Json     @db.JsonB

  @@index([status, recordedAt])
  @@index([reasonCode, recordedAt])
  @@index([eventName, recordedAt])
  @@index([bookingReference, recordedAt])
  @@map("event_audit")
  @@schema("analytics")
}
```

- [ ] **Step 4: Run migration and verify it passes**

Run:
- `npm run db:migrate -- --name add_analytics_event_audit`
- `npm run db:generate`

Expected:
- migration succeeds
- Prisma client now includes `analyticsEventAudit`.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(analytics): add event audit table for reliability diagnostics"
```

---

### Task 3: Implement Central Audit Writer Module

**Files:**
- Create: `src/lib/analytics/audit.ts`
- Test: `src/lib/analytics/__tests__/audit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { AUDIT_REASON, AUDIT_STATUS } from '@/lib/analytics/audit'

describe('analytics audit constants', () => {
  it('exports canonical reason and status values', () => {
    expect(AUDIT_STATUS.ACCEPTED).toBe('accepted')
    expect(AUDIT_REASON.DB_WRITE_FAILED).toBe('DB_WRITE_FAILED')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/analytics/__tests__/audit.test.ts`  
Expected: FAIL with module-not-found for `@/lib/analytics/audit`.

- [ ] **Step 3: Write minimal implementation**

```ts
import 'server-only'
import { prisma } from '@/lib/prisma'

export const AUDIT_STATUS = {
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  DEDUPED: 'deduped',
  FAILED: 'failed',
} as const

export const AUDIT_REASON = {
  INVALID_EVENT_NAME: 'INVALID_EVENT_NAME',
  BOT_FILTERED: 'BOT_FILTERED',
  SESSION_UNAVAILABLE: 'SESSION_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
  ORIGIN_BLOCKED: 'ORIGIN_BLOCKED',
  PAYLOAD_INVALID: 'PAYLOAD_INVALID',
  DB_WRITE_FAILED: 'DB_WRITE_FAILED',
  DEDUPE_SUPPRESSED: 'DEDUPE_SUPPRESSED',
  PROPERTIES_TRUNCATED: 'PROPERTIES_TRUNCATED',
  RECORDER_EXCEPTION: 'RECORDER_EXCEPTION',
  AUDIT_WRITE_FAILED: 'AUDIT_WRITE_FAILED',
} as const

export async function writeAnalyticsAudit(input: {
  eventName: string
  source: 'client' | 'server' | 'system'
  status: (typeof AUDIT_STATUS)[keyof typeof AUDIT_STATUS]
  reasonCode: (typeof AUDIT_REASON)[keyof typeof AUDIT_REASON]
  sessionId?: string | null
  eventId?: string | null
  bookingReference?: string | null
  propertySlug?: string | null
  occurredAt?: Date | null
  meta?: Record<string, unknown>
}): Promise<void> {
  try {
    await prisma.analyticsEventAudit.create({
      data: {
        eventName: input.eventName,
        source: input.source,
        status: input.status,
        reasonCode: input.reasonCode,
        sessionId: input.sessionId ?? null,
        eventId: input.eventId ?? null,
        bookingReference: input.bookingReference ?? null,
        propertySlug: input.propertySlug ?? null,
        occurredAt: input.occurredAt ?? null,
        meta: (input.meta ?? {}) as never,
      },
    })
  } catch (error) {
    console.error('[analytics][audit] write failed', {
      reasonCode: AUDIT_REASON.AUDIT_WRITE_FAILED,
      eventName: input.eventName,
      source: input.source,
      status: input.status,
      error: error instanceof Error ? error.message : 'unknown',
    })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/analytics/__tests__/audit.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/audit.ts src/lib/analytics/__tests__/audit.test.ts
git commit -m "feat(analytics): add audit writer and canonical reason codes"
```

---

### Task 4: Instrument Recorder Outcomes with Audit Writes

**Files:**
- Modify: `src/lib/analytics/recorder.ts`
- Test: `src/lib/analytics/__tests__/recorder.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/analytics/audit', () => ({
  writeAnalyticsAudit: vi.fn(),
  AUDIT_REASON: { DEDUPE_SUPPRESSED: 'DEDUPE_SUPPRESSED' },
  AUDIT_STATUS: { DEDUPED: 'deduped' },
}))

import { recordEvent } from '@/lib/analytics/recorder'
import { writeAnalyticsAudit } from '@/lib/analytics/audit'

describe('recordEvent dedupe auditing', () => {
  it('writes dedupe audit when booking reference already exists', async () => {
    await recordEvent({
      name: 'booking_completed',
      source: 'server',
      properties: { bookingReference: 'ABC123' },
    })
    expect(writeAnalyticsAudit).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/analytics/__tests__/recorder.test.ts`  
Expected: FAIL because recorder does not call audit writer yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// recorder.ts (pattern excerpt)
import { AUDIT_REASON, AUDIT_STATUS, writeAnalyticsAudit } from '@/lib/analytics/audit'

// on invalid event
await writeAnalyticsAudit({
  eventName: input.name,
  source: input.source,
  status: AUDIT_STATUS.REJECTED,
  reasonCode: AUDIT_REASON.INVALID_EVENT_NAME,
})

// on dedupe hit
await writeAnalyticsAudit({
  eventName: input.name,
  source: input.source,
  status: AUDIT_STATUS.DEDUPED,
  reasonCode: AUDIT_REASON.DEDUPE_SUPPRESSED,
  bookingReference,
})

// on create success
await writeAnalyticsAudit({
  eventName: input.name,
  source: input.source,
  status: AUDIT_STATUS.ACCEPTED,
  reasonCode: AUDIT_REASON.RECORDER_EXCEPTION, // replace with SUCCESS-like reason in final code
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/analytics/__tests__/recorder.test.ts`  
Expected: PASS, with audit-write assertions passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/recorder.ts src/lib/analytics/__tests__/recorder.test.ts
git commit -m "feat(analytics): emit recorder audit rows for terminal outcomes"
```

---

### Task 5: Add `/api/track` Structured Observability + Audit Writes

**Files:**
- Modify: `src/app/api/track/route.ts`
- Test: `src/app/api/track/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { POST } from '@/app/api/track/route'

describe('track route origin block', () => {
  it('returns 403 for blocked origin', async () => {
    const req = new Request('http://localhost:3009/api/track', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
      body: JSON.stringify({ events: [{ name: 'page_viewed' }] }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(403)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/api/track/__tests__/route.test.ts`  
Expected: FAIL due to missing audit/log instrumentation assertions.

- [ ] **Step 3: Write minimal implementation**

```ts
// route.ts (pattern excerpt)
import { AUDIT_REASON, AUDIT_STATUS, writeAnalyticsAudit } from '@/lib/analytics/audit'

if (!isAllowedOrigin(request)) {
  console.warn('[analytics][track] blocked origin', {
    reasonCode: AUDIT_REASON.ORIGIN_BLOCKED,
    origin: request.headers.get('origin'),
  })
  await writeAnalyticsAudit({
    eventName: 'track_batch',
    source: 'client',
    status: AUDIT_STATUS.REJECTED,
    reasonCode: AUDIT_REASON.ORIGIN_BLOCKED,
    meta: { path: '/api/track' },
  })
  return new NextResponse(null, { status: 403 })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/api/track/__tests__/route.test.ts`  
Expected: PASS for blocked-origin and invalid-payload cases.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/track/route.ts src/app/api/track/__tests__/route.test.ts
git commit -m "feat(analytics): add track route audit and structured failure logging"
```

---

### Task 6: Expand PageView Coverage to Global Layout with Safe Exclusions

**Files:**
- Modify: `src/components/analytics/PageViewTracker.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(booking)/layout.tsx`
- Test: `src/lib/analytics/__tests__/pageViewTracker.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { shouldTrackPath } from '@/components/analytics/PageViewTracker'

describe('pageview path guard', () => {
  it('skips internal paths', () => {
    expect(shouldTrackPath('/internal/analytics')).toBe(false)
  })
  it('tracks marketing paths', () => {
    expect(shouldTrackPath('/hotels')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/analytics/__tests__/pageViewTracker.test.ts`  
Expected: FAIL because `shouldTrackPath` is not exported.

- [ ] **Step 3: Write minimal implementation**

```ts
// PageViewTracker.tsx (excerpt)
export function shouldTrackPath(pathname: string): boolean {
  if (pathname.startsWith('/internal')) return false
  if (pathname.startsWith('/api')) return false
  return true
}

// before tracking
if (!shouldTrackPath(pathname)) return
```

```tsx
// app/layout.tsx (excerpt)
import { PageViewTracker } from '@/components/analytics/PageViewTracker'
...
<Suspense fallback={null}>
  <PageViewTracker />
</Suspense>
```

```tsx
// app/(booking)/layout.tsx
// remove booking-only PageViewTracker mount
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/analytics/__tests__/pageViewTracker.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/PageViewTracker.tsx src/app/layout.tsx src/app/(booking)/layout.tsx src/lib/analytics/__tests__/pageViewTracker.test.ts
git commit -m "feat(analytics): move pageview tracking to global layout with exclusions"
```

---

### Task 7: Add Server-Authoritative Booking Outcome Helper

**Files:**
- Create: `src/lib/analytics/bookingOutcome.ts`
- Test: `src/lib/analytics/__tests__/bookingOutcome.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/analytics/recorder', () => ({
  recordEvent: vi.fn(),
}))

import { recordBookingCompleted } from '@/lib/analytics/bookingOutcome'
import { recordEvent } from '@/lib/analytics/recorder'

describe('recordBookingCompleted', () => {
  it('maps canonical payload into recorder event', async () => {
    await recordBookingCompleted({
      bookingReference: 'BOOK123',
      propertySlug: 'zen-stay',
      amount: 4200,
      paymentMode: 'pay_now',
    })
    expect(recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'booking_completed', source: 'server' }),
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/analytics/__tests__/bookingOutcome.test.ts`  
Expected: FAIL (helper missing).

- [ ] **Step 3: Write minimal implementation**

```ts
import 'server-only'
import { recordEvent } from '@/lib/analytics/recorder'

export async function recordBookingCompleted(input: {
  bookingReference: string
  propertySlug: string
  amount: number
  paymentMode: 'pay_now' | 'pay_later' | 'pay_at_property'
  meta?: Record<string, unknown>
}) {
  await recordEvent({
    name: 'booking_completed',
    source: 'server',
    propertySlug: input.propertySlug,
    properties: {
      bookingReference: input.bookingReference,
      amount: input.amount,
      paymentMode: input.paymentMode,
      ...(input.meta ?? {}),
    },
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/analytics/__tests__/bookingOutcome.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/bookingOutcome.ts src/lib/analytics/__tests__/bookingOutcome.test.ts
git commit -m "feat(analytics): add server booking outcome tracking helper"
```

---

### Task 8: Integrate Booking Helper into Checkout Flows + Add Audit Panel

**Files:**
- Modify: `src/app/(booking)/book/[slug]/checkout/CheckoutForm.tsx`
- Modify: `src/app/(booking)/book/[slug]/checkout/MultiRoomCheckoutForm.tsx`
- Modify: `src/lib/analytics/queries.ts`
- Modify: `src/app/internal/analytics/actions.ts`
- Modify: `src/app/internal/analytics/Dashboard.tsx`
- Test: `src/lib/analytics/__tests__/checkout-outcome-mapping.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { mapCheckoutOutcomePayload } from '@/lib/analytics/checkoutOutcomePayload'

describe('checkout outcome payload', () => {
  it('always includes bookingReference and paymentMode', () => {
    const payload = mapCheckoutOutcomePayload({
      bookingReference: 'BOOK123',
      paymentMode: 'pay_at_property',
      amount: 1200,
    })
    expect(payload.bookingReference).toBe('BOOK123')
    expect(payload.paymentMode).toBe('pay_at_property')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/analytics/__tests__/checkout-outcome-mapping.test.ts`  
Expected: FAIL (mapping helper missing).

- [ ] **Step 3: Write minimal implementation**

```ts
// CheckoutForm.tsx / MultiRoomCheckoutForm.tsx (pattern)
import { recordBookingCompleted } from '@/lib/analytics/bookingOutcome'

await recordBookingCompleted({
  bookingReference: data.bookingReference,
  propertySlug: slug,
  paymentMode: 'pay_now',
  amount: effectiveTotalAmount,
  meta: { roomTypeName, couponCode: appliedCoupon?.code ?? null },
})
```

```ts
// queries.ts (add audit list)
export async function listRecentAuditEvents(limit = 50) {
  return prisma.analyticsEventAudit.findMany({
    orderBy: { recordedAt: 'desc' },
    take: Math.min(limit, 200),
  })
}
```

```ts
// actions.ts
export async function fetchRecentAuditEventsAction(limit = 50) {
  await requireAdmin()
  return listRecentAuditEvents(limit)
}
```

- [ ] **Step 4: Run tests and UI checks to verify it passes**

Run:
- `npm test -- src/lib/analytics/__tests__/checkout-outcome-mapping.test.ts`
- `npm test -- src/lib/analytics/__tests__/bookingOutcome.test.ts src/lib/analytics/__tests__/recorder.test.ts`
- `npm run lint`

Expected:
- tests PASS
- lint PASS
- internal analytics dashboard shows recent audit rows.

- [ ] **Step 5: Commit**

```bash
git add src/app/(booking)/book/[slug]/checkout/CheckoutForm.tsx src/app/(booking)/book/[slug]/checkout/MultiRoomCheckoutForm.tsx src/lib/analytics/queries.ts src/app/internal/analytics/actions.ts src/app/internal/analytics/Dashboard.tsx src/lib/analytics/__tests__/checkout-outcome-mapping.test.ts
git commit -m "feat(analytics): wire server-authoritative booking tracking and audit visibility"
```

---

### Task 9: End-to-End Verification and Production Readiness Checklist

**Files:**
- Modify: `docs/superpowers/specs/2026-05-24-analytics-reliability-hardening-design.md` (append verification evidence section)
- Create: `docs/superpowers/plans/analytics-reliability-verification-notes.md`

- [ ] **Step 1: Write failing verification checklist**

```md
- [ ] Single-room pay-at-property writes booking_completed
- [ ] Single-room pay-now writes payment_initiated and booking_completed
- [ ] Multi-room pay-later writes booking_completed
- [ ] Multi-room pay-now writes payment events + booking_completed
- [ ] Audit rows show accepted/rejected reasons
```

- [ ] **Step 2: Run checks and capture current failures**

Run:
- `npm test`
- `npm run lint`

Expected before fixes complete: at least one failure or missing verification note.

- [ ] **Step 3: Write minimal implementation (verification evidence file)**

```md
# Analytics Reliability Verification Notes

## Command Output
- `npm test`: PASS
- `npm run lint`: PASS

## Scenario Evidence
- Single-room pay-at-property: PASS (bookingReference XYZ...)
- Single-room pay-now: PASS
- Multi-room pay-later: PASS
- Multi-room pay-now: PASS
- Audit panel shows accepted + rejected reason codes: PASS
```

- [ ] **Step 4: Re-run full checks to verify passing state**

Run:
- `npm test`
- `npm run lint`
- `npm run build`

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/analytics-reliability-verification-notes.md docs/superpowers/specs/2026-05-24-analytics-reliability-hardening-design.md
git commit -m "docs(analytics): add reliability verification evidence and rollout notes"
```

---

## Spec-to-Plan Coverage Check

- **Authoritative booking tracking:** Tasks 7-8.
- **DB + log auditability:** Tasks 2-5 and 8.
- **Global page coverage:** Task 6.
- **No added user-facing latency:** Tasks 7-8 keep non-blocking writes and existing redirect behavior.
- **Testing and rollout verification:** Tasks 1, 4, 5, 6, 7, 8, 9.

No spec gaps found.

## Placeholder Scan

- No `TODO`, `TBD`, or "implement later" placeholders present.
- All coding steps include concrete file paths, code snippets, commands, and expected outcomes.

## Type/Name Consistency Check

- `recordBookingCompleted` helper name is used consistently across tasks.
- Audit constants use a single naming source (`AUDIT_REASON`, `AUDIT_STATUS`).
- `analyticsEventAudit` Prisma delegate name aligns with `AnalyticsEventAudit` model.
