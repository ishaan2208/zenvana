# Zenvana

The Zenvana marketing site and guest-facing web surface — a Next.js App Router app that carries the brand's "quiet luxury, Indian boutique hospitality" identity across marketing, booking, guest, and account flows. The goal is brand-grade polish: every surface should feel considered, fast, and accessible.

## Architecture & intent

- **Next.js 14 App Router + TypeScript**, Tailwind v3, framer-motion, Radix + Headless UI primitives, next-themes. Dev server runs on **port 3009**.
- **Route groups** in `src/app/` segment the surfaces: `(marketing)`, `(booking)`, `(guest)`, `(account)`, `(auth)`, plus `internal/` (blog CMS + analytics admin). Shared building blocks live in `src/components/`, `src/features/`, `src/lib/`, `src/hooks/`.
- **Two data planes.** Most content and booking data comes from the sibling `backend` (`api.staysystems.in`) via `NEXT_PUBLIC_BACKEND_URL`. A dedicated **Prisma/Postgres (Neon)** layer (`prisma/schema.prisma`) backs only the `blog` and `analytics` schemas — first-party blog CMS content and the booking-funnel analytics/event pipeline. Prisma is not the app's primary datastore; keep it scoped to those two schemas.
- **Payments** run through Razorpay, and **the backend owns every amount.** Checkout calls the backend's `POST /public/properties/:slug/booking/razorpay-order`, which re-prices the stay from its own rate chart, creates the order, and stores a pending-checkout row; the browser's total is a display hint the backend may reject with `409 PRICE_CHANGED` (see `src/lib/price-guard-errors.ts`). This app must never compute or transmit an authoritative price. (`src/app/api/razorpay/order/route.ts` is an unused legacy route that mints an order for any client-supplied amount — it has no callers; do not wire anything to it.)
- **Design is governed by sidecar docs — read them before design/UX work:** `PRODUCT.md` (strategy, voice, accessibility floor — wins on strategic/voice calls) and `DESIGN.md` (colors, type, elevation — wins on visual calls). `.impeccable/design.json` is the machine-readable design sidecar; use `/impeccable` commands for design tasks.

## Boundaries

- **Accessibility is a floor, not a nice-to-have:** WCAG 2.1/2.2 AA, reduced-motion honored, hero scrims mandatory. Do not ship UI that regresses these.
- **Brand tokens are the source of truth** — Midnight Mirage `#001F3F`, Sand `#F6F7ED`, Spring `#DBE64C`; Fraunces (display) / Inter (body) / Lexend (UI titles). Style through the Tailwind theme and design tokens, not ad-hoc hex values.
- Keep Prisma confined to the `blog` and `analytics` schemas. Razorpay **secrets** (`RAZORPAY_KEY_SECRET`) stay server-side only — never expose them to the client or log them.
- `RAZORPAY_KEY_ID` may be public; the secret may not. Order creation stays in the backend, which is also the only component allowed to decide what a booking costs.
- Env is split: Prisma CLI reads `.env`, Next.js dev reads `.env.local` — keep both in sync when changing DB URLs.

## Verify your work

```bash
npm run dev            # port 3009
npm run build          # must compile clean
npm run lint           # next lint
npm test               # vitest (node env, src/**/*.test.ts)
npm run test:typecheck # tsc against tsconfig.vitest.json
```

For schema changes: `npm run db:generate` / `db:migrate` / `db:push` (all wrap Prisma via `dotenv -e .env.local`). Done and correct means build, lint, and vitest pass; no accessibility or brand-token regressions; and any design change reconciles with `PRODUCT.md` and `DESIGN.md`.
