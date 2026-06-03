# Product

## Register

brand

## Users

Zenvana serves a mixed audience with no single segment dominating:

- **Leisure travelers and families** researching a Dehradun stay, comparing properties (Rosewood, Limewood, Silkwood, Monteverde, Serenwood, and others), and deciding where to book direct.
- **Business and corporate travelers** who need reliable location, fast booking, and predictable quality near Rajpur Road.
- **Wedding and event planners** evaluating venues, rooftop experiences, and group packages.
- **In-house guests** using the guest portal and assistant during their stay for services, menu, and stay information.

All segments matter. Marketing surfaces lead; booking and in-stay flows must feel equally considered, not bolted on.

## Product Purpose

Zenvana Hotels is an owner-operated boutique hotel group on Rajpur Road, Dehradun. The site exists to tell the story of each property, build trust through editorial content, and convert visitors into direct bookings (reducing OTA dependency) while supporting the full guest journey from discovery through checkout and in-stay digital touchpoints.

Success in the next 6–12 months is balanced growth: more direct bookings, stronger brand trust and SEO/editorial presence, smoother booking checkout, and a better in-stay digital experience.

## Brand Personality

**Quiet luxury.** Calm, editorial, understated confidence. Owner-operated authenticity with the polish of Indian boutique hospitality (Taj, Neemrana, CGH Earth as reference points: heritage sensibility with modern comfort, not corporate chain sterility).

Voice is warm but restrained. Specific about place (Dehradun, Rajpur Road, Himalayan foothills) and experience (rooftop views, family suites, curated comfort). Never shouts; earns attention through photography, typography, and considered detail.

## Anti-references

This should explicitly NOT look or feel like:

- **OTA generic** — Booking.com / MakeMyTrip price-first grids, cluttered filters, impersonal listing cards.
- **SaaS template** — Tailwind UI starter residue, gradient heroes, metric blocks, software-marketing copy on a hotel site.
- **Luxury cliché** — gold gradients, marble textures, all-caps "LUXURY EXPERIENCE" copy, thin low-contrast gray type over photography.
- **Corporate chain hotel** — stock-photo sameness, sterile layouts, no sense of place.
- **AI-generated hotel patterns** — eyebrow kickers on every section, identical icon-card grids, cream/sand default backgrounds, numbered section scaffolding (01 / 02 / 03) without informational purpose.

**Text-over-image failure mode:** Magazine-cover heroes with type that fails contrast. Any headline over photography must hit WCAG AA via scrim or overlay regardless of the photo underneath.

## Design Principles

1. **Show the stay, don't sell the stay.** Lead with photography, place, and specific property character. Conversion follows trust, not urgency tricks.
2. **Direct booking is the reward, not the pitch.** "Book direct" value is woven into the experience (offers, stay-direct pages), not shouted in every hero.
3. **One calm system across surfaces.** Marketing editorial, booking checkout, and guest tools share typography, color discipline, and motion language. Product flows inherit brand quality.
4. **Place is the differentiator.** Dehradun, Rajpur Road, foothill views, rooftop cafes: specificity beats generic "boutique luxury" language.
5. **Motion serves meaning; never gates content.** Framer Motion and editorial reveals enhance an already-visible default. Under `prefers-reduced-motion`, all motion degrades to instant or crossfade; nothing essential is conveyed by animation alone.

## Accessibility & Inclusion

**Target:** WCAG 2.1/2.2 AA as the floor for a public commercial booking site. AA supports both legal exposure management and SEO; flag legal specifics to counsel if exposure is a concern.

**Non-negotiable:**

- **`prefers-reduced-motion`:** All motion (Framer Motion, parallax, spring drag, marquee) degrades to a reduced-motion variant. Nothing essential conveyed by animation alone.
- **Text-over-image contrast:** Headlines and body over photography must hit AA via scrim/overlay regardless of the underlying image. Reject thin low-contrast "luxury gray" type; it fails AA and alienates older affluent guests.
- **Mobile-first, variable bandwidth:** Image-heavy pages on Indian mobile networks must lazy-load, degrade gracefully, and avoid punishing slow connections. Performance is accessibility.
- **Booking-flow operability:** Date picker → room select → checkout must be fully keyboard- and screen-reader-navigable. Date pickers (shadcn month picker) are a known failure point in the conversion funnel.
- **Legibility for older affluent guests:** Generous type sizes and touch targets; resist ultra-light "luxury" weights for body copy.
