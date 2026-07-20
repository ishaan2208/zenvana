# Hotel Video Hero Layout

## Goal

Recompose the property hero so video supports the hotel story instead of consuming the full page width. The layout must remain photography-led, calm, legible, and conversion-focused across mobile and desktop.

## Responsive composition

- Start with a single-column mobile layout: hotel identity and actions, compact video, then a two-column facts grid.
- At large viewports, switch to an intrinsic `2fr minmax(18rem, 1fr)` grid. Information occupies the left two-thirds and the walkthrough film occupies the right third.
- Cap the overall content width with the existing `Container`. Let text, actions, and facts size to their content; avoid fixed heights except minimum touch targets.
- Use a 4:3 media ratio on mobile and a portrait-oriented ratio on desktop so the film remains substantial without dominating the fold.
- Remove the separate full-width quick-facts stripe. Airport, railway, room types, and setting become compact tiles inside the hero information column.

## Information hierarchy

1. Back-to-hotels utility action.
2. Property name.
3. Location and telephone metadata.
4. Short property description.
5. Primary availability action and secondary map action.
6. Four practical facts.
7. Walkthrough film with a concise label and poster fallback.

The property name remains the strongest typographic element, but its fluid scale stays within the project design-system ceiling. Supporting copy is capped to a readable line length.

## Components and behavior

- Keep the existing `AmbientVideo` delivery behavior: poster-first rendering, cost-capped responsive renditions, deferred loading, off-screen pausing, Save-Data handling, and reduced-motion support.
- Keep booking URLs, coupon propagation, map links, phone links, structured data, and the mobile sticky booking bar unchanged.
- Retain a still-image fallback for properties without a walkthrough.
- Keep the gallery preview below the main hero composition; it should no longer compete with a full-width film above it.

## Micro-interactions

- Film container: subtle border/shadow lift and a restrained poster/video scale on hover-capable devices.
- Links and secondary actions: small icon translation and color/border changes.
- Buttons: existing press feedback and plane transition.
- Keyboard focus: visible focus rings with no reliance on hover.
- Reduced motion: no scale or translation; transitions resolve instantly or as a short crossfade.

## Accessibility and performance

- Preserve AA contrast on the dark hero.
- Maintain at least 44px interactive targets.
- Do not autoplay audio or expose decorative video to assistive technology.
- Use the poster as immediate visual content and never gate text on video readiness.
- Validate at narrow mobile, tablet, standard desktop, and wide desktop widths.

## Verification

- Run lint/type checks appropriate to the project.
- Confirm the page with and without a walkthrough.
- Verify mobile stacking, desktop 2:1 composition, keyboard focus, reduced motion, poster fallback, and sticky booking-bar clearance.
- Inspect the rendered page visually at representative mobile and desktop widths.
