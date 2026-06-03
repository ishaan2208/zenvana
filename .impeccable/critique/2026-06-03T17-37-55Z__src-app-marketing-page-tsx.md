---
target: src/app/(marketing)/page.tsx
total_score: 25
p0_count: 1
p1_count: 3
timestamp: 2026-06-03T17-37-55Z
slug: src-app-marketing-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Hero book bar defers with skeleton; live bookings counter updates. Disabled "Book" button gives no inline reason when property is unset. |
| 2 | Match System / Real World | 3 | Owner letter and property intents feel human. SEO H2 ("Best Hotel in Dehradun") breaks the quiet-luxury voice. |
| 3 | User Control and Freedom | 3 | Standard nav, FAQ `<details>`, sticky mobile escape hatches (call/WhatsApp). No traps. |
| 4 | Consistency and Standards | 2 | Nine identical `editorial-eyebrow` kickers and `gold-text` gradient type conflict with PRODUCT.md / DESIGN.md bans. |
| 5 | Error Prevention | 2 | Property dropdown overflows its container on mobile (browser detect). Book stays disabled without guidance. |
| 6 | Recognition Rather Than Recall | 2 | Twelve sections before footer; "View full gallery" routes to `/hotels`, not a gallery. |
| 7 | Flexibility and Efficiency | 2 | Hero book bar is the efficient path; no shortcuts beyond that for repeat guests. |
| 8 | Aesthetic and Minimalist Design | 2 | Trust stat strip + stay-direct benefit grid + tier cards repeat the same card grammar too often. |
| 9 | Error Recovery | 3 | Marketing page; errors are rare. FAQ covers planning mistakes well. |
| 10 | Help and Documentation | 3 | Eight-question FAQ is task-focused and plain-language. Contact paths visible. |
| **Total** | | **25/40** | **Acceptable — significant polish needed before this feels flagship** |

## Anti-Patterns Verdict

**LLM assessment:** Borderline AI tell. The photography, owner letter, and tier-specific property copy are genuinely on-brand and specific to Dehradun. But the page structure still reads like a 2024–2026 AI hotel scaffold: uppercase eyebrow on nearly every section (9 instances), a four-stat trust strip under the hero, a four-tile benefits grid in Stay Direct, and gradient gold headline accents. Someone familiar with boutique hospitality would not call this OTA-generic, but someone familiar with AI landing pages would recognize the section cadence immediately.

**Deterministic scan (CLI):** `detect.mjs` on `page.tsx` and `(marketing)/` returned **0 findings**. Static scan missed patterns defined in `globals.css` (`.gold-text`, `.editorial-eyebrow`, `.quiet-card` shadows).

**Browser visualization:** Injection succeeded. Overlays were visible in the browser tab, reporting at minimum:
- `repeated section kicker labels` (eyebrow pattern, 9× on page)
- `content overflowing its container` (hero property dropdown on mobile)
- `hairline border with wide shadow` (`.quiet-card` / bordered stat tiles, many instances)
- `nested cards` (stat strip + tier cards)

**False positives:** "Hairline border with wide shadow" on stat tiles is partially intentional brand shadow vocabulary, but the volume (30+ flagged nodes) signals overuse of the same card treatment.

## Overall Impression

The hero lands: video, scrim, serif headline, and in-page booking bar are the right flagship moves for a direct-booking boutique group. The page loses its quiet-luxury claim in the next three scrolls — metrics, repeated kickers, and a second full card grid make it feel longer and more templated than the copy promises. The single biggest opportunity is **structural editing**: fewer sections, fewer eyebrows, one trust moment instead of three.

## What's Working

1. **Hero + book bar composition** — Full-bleed foothill video, `bg-hero-shade` scrim, and deferred `HeroBookBar` put conversion in the first viewport without a separate OTA-style search page. White type on scrim reads well in the live check.

2. **Property pyramid with tier language** — Essential / Refined / Signature grouping with specific intent copy per hotel (Rosewood, Silkwood, etc.) is exactly the Indian-boutique differentiation PRODUCT.md asks for. Photography is real, not stock.

3. **Owner letter section** — The "note from the owner" prose is specific, warm, and anti-OTA in the right way. It earns trust without a metric block.

## Priority Issues

### [P0] Hero property dropdown overflows on mobile
- **Why it matters:** Browser detect flagged `content overflowing its container`. On a 390px viewport the property list extends past the book bar and overlaps the sticky CTA, making selection awkward at the primary conversion point.
- **Fix:** Constrain popover max-height, portal to body, or use a drawer on small screens. Test at 320–430px widths.
- **Suggested command:** `/impeccable adapt src/app/(marketing)/HeroBookBar.tsx`

### [P1] Nine section eyebrows violate your own anti-AI rule
- **Why it matters:** PRODUCT.md and DESIGN.md both ban "eyebrow on every section." Nine `editorial-eyebrow` labels ("The collection", "Dining", "Celebrations", etc.) create the exact AI grammar you documented.
- **Fix:** Keep one deliberate kicker (owner note or collection). Remove or replace the rest with typographic hierarchy only (rule-gold, spacing, h2 scale).
- **Suggested command:** `/impeccable quieter src/app/(marketing)/page.tsx`

### [P1] Gradient gold text (`gold-text`) is a banned pattern
- **Why it matters:** Used in hero H1 ("Dehradun") and Stay Direct H2. DESIGN.md explicitly prohibits `background-clip: text` gradient type. It also weakens contrast predictability on video backgrounds.
- **Fix:** Replace with solid gold token (`hsl(var(--gold))`) or white with underline-gold emphasis.
- **Suggested command:** `/impeccable typeset src/app/(marketing)/page.tsx`

### [P1] Trust stat strip reads as hero-metric template
- **Why it matters:** Four icon + big number + label cards (4.0+ rating, live bookings, 5 properties, best rate) mirror the SaaS/AI metric strip PRODUCT.md rejects. Subcopy name-drops MakeMyTrip and Booking.com, undermining the direct-booking story in the first scroll after the hero.
- **Fix:** Collapse to one line of social proof or merge into the owner letter. Lead with direct-booking proof, not OTA parity.
- **Suggested command:** `/impeccable distill src/app/(marketing)/page.tsx`

### [P2] "View full gallery" misroutes to `/hotels`
- **Why it matters:** Recognition failure — users expect a gallery route or lightbox, not the hotel listing index. Hurts trust for deliberate planners (Jordan, wedding personas).
- **Fix:** Link to a dedicated gallery section anchor, `/hotels` with hash, or a lightbox on the existing grid.
- **Suggested command:** `/impeccable clarify src/app/(marketing)/page.tsx`

## Persona Red Flags

**Jordan (Confused First-Timer):** Taps "Book" in the hero bar before choosing a property — button stays disabled with no explanation. Opens "View full gallery" expecting photos, lands on hotel listings. Twelve sections before the FAQ makes "where do I start?" unclear despite good copy in each block.

**Casey (Distracted Mobile User):** Property dropdown overflow fights the sticky "Browse hotels" bar for thumb space. Hero book bar fields are dense on small screens; primary sticky CTA says "Browse hotels" instead of continuing the in-hero booking flow. Marquee press strip animates unless reduced-motion (handled in CSS, good).

**The Deliberate Planner (project persona — wedding/leisure researcher):** Trust strip cites OTAs before Zenvana's direct promise. SEO-heavy H2 ("Best Hotel in Dehradun · Zenvana on Rajpur Road") after a calm hero feels like keyword stuffing, not quiet luxury. Gallery duplicates property photos already shown in the pyramid section.

## Minor Observations

- Stay Direct benefit titles use uppercase tracking — close to luxury-cliché territory; sentence case would match owner letter voice.
- Gallery grid reuses the same assets as the property pyramid; feels redundant on one page.
- `animate-fade-up` on hero headline should verify reduced-motion fallback (global CSS handles this).
- FAQ `<summary>` plus-only toggle is low-contrast for older guests; consider chevron icon with visible label.
- Press marquee duplicates items for animation — fine, but six uppercase tracked labels add visual noise.

## Questions to Consider

- What if the homepage ended after collection + one stay-direct moment + FAQ — and moved dining, weddings, gallery to secondary routes?
- What if trust were one sentence from the owner instead of four stat cards?
- What would a confident version of this page look like with **zero** uppercase eyebrows?
