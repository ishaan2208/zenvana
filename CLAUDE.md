# CLAUDE.md

## Design Context

Strategic and visual context for AI agents working on this codebase.

- **PRODUCT.md** — Register, users, purpose, brand personality, anti-references, design principles, accessibility requirements. Read before any design or UX task.
- **DESIGN.md** — Visual system: colors, typography, elevation, components, do's and don'ts. Wins on visual decisions; PRODUCT.md wins on strategic/voice decisions.
- **`.impeccable/design.json`** — Machine-readable design sidecar for live variant mode.

### Quick reference

| Field | Value |
|-------|-------|
| Register | **brand** (marketing-led; booking/guest flows inherit brand quality) |
| Personality | Quiet luxury, Indian boutique hospitality |
| Primary colors | Midnight Mirage `#001F3F`, Sand `#F6F7ED`, Spring `#DBE64C` |
| Display / body fonts | Fraunces / Inter (+ Lexend for UI titles) |
| Accessibility floor | WCAG 2.1/2.2 AA; reduced motion non-negotiable; hero scrims mandatory |
| Dev server | `npm run dev` → http://localhost:3009 |

Use `/impeccable` commands for design work (craft, polish, audit, live, etc.).
