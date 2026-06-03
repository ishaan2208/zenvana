---
target: src/app/(marketing)/page.tsx
total_score: 32
p0_count: 0
p1_count: 0
timestamp: 2026-06-03T17-47-43Z
slug: src-app-marketing-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Book hint (`role="status"`) explains disabled CTA; live counter and skeleton loaders remain solid. |
| 2 | Match System / Real World | 4 | Owner letter and tier copy feel human; visible H2 no longer keyword-stuffed (SEO moved to `sr-only`). |
| 3 | User Control and Freedom | 3 | FAQ, nav, call/WhatsApp exits unchanged and adequate. |
| 4 | Consistency and Standards | 3 | Eyebrows down to 2 (owner + GuestVoices); solid gold text aligns with DESIGN.md. Trust strip + benefit grid still repeat card grammar. |
| 5 | Error Prevention | 3 | Select/popover collision padding fixes mobile overflow; date validation message unchanged. |
| 6 | Recognition Rather Than Recall | 3 | Gallery section removed; mobile CTA anchors to `#book`. Page still ~11 sections long. |
| 7 | Flexibility and Efficiency | 2 | Hero book bar remains the main efficient path. |
| 8 | Aesthetic and Minimalist Design | 3 | Less AI scaffolding, but stat strip + Stay Direct grid + tier cards still stack similar patterns. |
| 9 | Error Recovery | 3 | Marketing surface; FAQ covers planning gaps. |
| 10 | Help and Documentation | 4 | FAQ chevron toggles improved; eight practical Q&As. |
| **Total** | | **32/40** | **Good — flagship polish within reach** |

## Anti-Patterns Verdict

**LLM assessment:** No longer reads as obvious AI slop. The repeated eyebrow cadence is mostly gone, gradient headline text is fixed, and the misleading gallery block is removed. What remains is intentional brand structure (tier pyramid, owner letter) plus two template-adjacent blocks you chose to keep (trust stat strip) or that still use icon+tile grids (Stay Direct).

**Deterministic scan (CLI):** `detect.mjs` on `page.tsx` and `(marketing)/` returned **0 findings** (unchanged limitation for CSS-class patterns).

**Browser visualization:** Injection succeeded. Overlays flagged **`hairline border with wide shadow`** (stat tiles, `.quiet-card` FAQ) and **`nested cards`**. Prior **`content overflowing its container`** on the property dropdown did **not** reappear. Verified live: `Select a property to continue` status present; mobile CTA reads **Book your stay** → `#book`.

## Overall Impression

The last pass moved this from "acceptable template" to "credible boutique flagship." Hero conversion, voice, and accessibility cues are materially better. The remaining gap is **section count and card repetition**, not broken UX.

## What's Working

1. **Hero book bar** — Hint text, collision-safe selects, and `#book` anchor make the primary funnel legible on mobile.
2. **Editorial voice** — Owner letter + tier intents carry quiet-luxury positioning without SEO shouting in visible headings.
3. **FAQ polish** — Chevron controls with visible borders beat the old low-contrast "+" toggle.

## Priority Issues

### [P2] Trust stat strip still hero-metric adjacent
- **Why it matters:** Four icon+number tiles under the hero echo SaaS metric blocks; OTA names in subcopy slightly undercut direct-booking story.
- **Fix:** You previously chose to keep it; optional later pass could swap OTA line for direct-booking proof only.
- **Suggested command:** `/impeccable distill src/app/(marketing)/page.tsx` (only if you reopen this)

### [P2] Stay Direct four-tile benefit grid
- **Why it matters:** Second identical card grid on one page; browser detect still flags nested cards here.
- **Fix:** Collapse to prose list or two-column narrative without icon tiles.
- **Suggested command:** `/impeccable layout src/app/(marketing)/page.tsx`

### [P2] Second eyebrow on home: GuestVoicesSection
- **Why it matters:** `"Guest voices"` in `GuestVoicesSection.tsx` reintroduces the kicker pattern you removed elsewhere on this page.
- **Fix:** Drop eyebrow; let H2 carry the section.
- **Suggested command:** `/impeccable quieter src/components/GuestVoicesSection.tsx`

### [P2] Page length / cognitive load
- **Why it matters:** ~11 sections before footer; dining + weddings + reviews + location + FAQ + dual booking CTAs compete for attention.
- **Fix:** Move weddings or dining to secondary routes only linked from nav; keep one closing booking moment.
- **Suggested command:** `/impeccable distill src/app/(marketing)/page.tsx`

## Persona Red Flags

**Jordan:** Much improved — book hint explains disabled state. Still a long scroll before FAQ if they need practical details first.

**Casey:** Sticky **Book your stay** → `#book` aligns with hero funnel. Property list scrolls inside constrained popover (fixed).

**Deliberate Planner:** Trust strip OTA mention still visible; otherwise voice and property differentiation read credible.

## Minor Observations

- `InitialSplash` briefly shows a second H1 before hero (flash only).
- Press marquee uppercase tracking adds noise under reduced-motion-safe animation.
- Stay Direct H2 line break can read as "andwe" in some accessibility snapshots (cosmetic spacing).

## Questions to Consider

- Would the homepage feel more flagship with **one** booking CTA block instead of Stay Direct + footer gradient + sticky bar?
- Is the trust strip doing enough work to justify its visual weight against the owner letter directly below?
