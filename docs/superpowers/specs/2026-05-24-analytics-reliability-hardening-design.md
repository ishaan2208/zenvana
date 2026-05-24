# Analytics Reliability Hardening Design (Forward-Only)

Date: 2026-05-24  
Project: `zenvana`  
Status: Approved design (brainstorming)  
Scope: Full hardening for forward event reliability, no historical backfill

## 1) Goals and Non-Goals

### Goals

- Eliminate silent loss of critical booking analytics events in forward traffic.
- Improve site-wide page/event coverage so analytics represents real user behavior.
- Add auditability so missing records can be diagnosed quickly.
- Preserve user experience by adding no blocking latency to booking confirmation flows.
- Keep analytics non-fatal: booking success must never depend on analytics success.

### Non-Goals

- No historical backfill for already missed events.
- No full event-journal + asynchronous reconciler system in this iteration.
- No broad unrelated refactor outside analytics reliability paths.

## 2) Architecture

Reliability is split into two tiers:

- Tier A (authoritative, server-written): booking/payment milestone events.
- Tier B (behavioral, client-written): navigation and funnel behavior events.

The critical change is that booking outcome events are recorded from trusted server code paths in this app, while preserving current response speed and not waiting on analytics before redirecting users.

## 3) Components and Data Flow

### 3.1 New Audit Store

Add a new table: `analytics.event_audit`.

Proposed columns:

- `id` (bigint/autoincrement)
- `eventName` (string)
- `source` (`client` | `server`)
- `status` (`accepted` | `rejected` | `deduped` | `failed`)
- `reasonCode` (string)
- `sessionId` (nullable string)
- `eventId` (nullable string)
- `bookingReference` (nullable string)
- `propertySlug` (nullable string)
- `occurredAt` (nullable datetime)
- `recordedAt` (datetime default now)
- `meta` (jsonb, sanitized)

Purpose: provide root-cause visibility for ingestion and recorder outcomes.

### 3.2 Recorder Hardening (`src/lib/analytics/recorder.ts`)

Keep public APIs stable:

- `recordEvent`
- `recordEventsBatch`

Internally emit audit rows for terminal outcomes:

- accepted
- rejected (invalid name / bot / missing session / origin / payload cases)
- deduped
- failed (DB write or recorder exception)
- properties truncated

Continue current invariant: recorder never throws into business flows.

### 3.3 Server-Authoritative Booking Event Writes

Introduce a dedicated helper for booking outcomes (name can vary, e.g. `recordBookingOutcomeEvent`) and use it in these success/failure paths:

- `src/app/(booking)/book/[slug]/checkout/CheckoutForm.tsx`
  - pay-at-property confirmation success
  - pay-now verify success and payment failure hooks where available
- `src/app/(booking)/book/[slug]/checkout/MultiRoomCheckoutForm.tsx`
  - pay-later confirmation success
  - pay-now verify success and payment failure hooks where available

Canonical event payload includes:

- `bookingReference` (when available)
- `paymentMode`
- `amount` and optional payment identifiers
- `propertySlug`

Deduplication remains enforced with booking reference for `booking_completed`.

### 3.4 Full-Site Page View Coverage

Move `PageViewTracker` from booking-only layout scope to an app-level shared layout so all public site areas are tracked consistently.

Add exclusions for internal/admin routes unless explicitly needed.

### 3.5 Ingestion Observability (`src/app/api/track/route.ts`)

Add structured observability for:

- blocked origin (403)
- rate limited (429)
- invalid payload (400/204 empty)
- accepted vs dropped event counts per request

Batch-level summary logs should be default; detailed per-event logs only on failures.

## 4) Error Handling and Audit Policy

### 4.1 Principle

Analytics is always best-effort from a product-flow perspective and must never prevent booking completion.

### 4.2 Reason Codes

Standardize reason codes:

- `INVALID_EVENT_NAME`
- `BOT_FILTERED`
- `SESSION_UNAVAILABLE`
- `RATE_LIMITED`
- `ORIGIN_BLOCKED`
- `PAYLOAD_INVALID`
- `DB_WRITE_FAILED`
- `DEDUPE_SUPPRESSED`
- `PROPERTIES_TRUNCATED`
- `RECORDER_EXCEPTION`
- `AUDIT_WRITE_FAILED`

### 4.3 Logging Rules

- Use structured JSON logs for operational filtering.
- Include identifiers like `eventName`, `source`, `reasonCode`, `status`, `requestId` (if present), `bookingReference` (if present), and masked/hashed session context.
- Do not log raw PII or full unsanitized properties.

### 4.4 Audit Write Failure Handling

- Attempt audit write in-line with recorder decision points.
- If audit write fails, emit fallback structured log with `AUDIT_WRITE_FAILED`.
- Never surface audit failures to users.

## 5) Testing and Verification

### 5.1 Tests

- Unit/integration tests for recorder terminal states.
- Route tests for `/api/track`: origin block, rate-limit, malformed payload, mixed-valid batches.
- Dedupe tests for repeated `booking_completed` with identical booking reference.

### 5.2 Critical E2E Paths

- Single-room pay-at-property success.
- Single-room pay-now success and failure.
- Multi-room pay-later success.
- Multi-room pay-now success and failure.
- Fast redirect/navigation after booking completion.

Expected for each success path:

- corresponding `analytics.event` row exists
- corresponding `analytics.event_audit` row indicates accepted (or explicit dedupe reason)

### 5.3 Rollout Checks (First 24h)

- Compare booking confirmations vs `booking_completed` counts in the same windows.
- Monitor audit reason-code distribution and alert on rising `DB_WRITE_FAILED` or `SESSION_UNAVAILABLE`.
- Validate page views appear across marketing + booking routes.

## 6) Rollout Plan

1. Add Prisma schema changes and migration for `event_audit`.
2. Implement recorder + route observability changes.
3. Move critical booking outcome tracking to server-authoritative helper usage.
4. Expand global page view tracker placement.
5. Run tests and manual smoke scenarios.
6. Deploy and monitor first-day parity and audit outcomes.

## 7) Open Decisions Resolved

- Full hardening selected.
- No historical backfill selected.
- Audit destination: both DB and logs selected.
- Booking latency trade-off: no added response latency selected.

## 8) Acceptance Criteria

- No observed missing `booking_completed` for newly created bookings in validated smoke windows.
- Dashboard-visible booking counts align with operational booking confirmations for sampled intervals.
- Audit table and logs provide clear diagnosis for any dropped or rejected events.
- User booking confirmation UX remains unchanged in perceived speed and behavior.
