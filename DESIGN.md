---
name: Zenvana Hotels
description: Quiet luxury boutique hospitality on Rajpur Road, Dehradun
colors:
  midnight-mirage: "#001F3F"
  praxeti-white: "#F6F7ED"
  spring-accent: "#DBE64C"
  book-green: "#00804C"
  editorial-gold: "#C8A85A"
  nuit-blanche: "#1E488F"
  ink: "#0A0E1A"
  muted-foreground: "#3A4F66"
  card-white: "#FFFFFF"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2rem, 5vw, 3.75rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.75rem, 3vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Lexend, Inter, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "0"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.28em"
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.75rem"
  pill: "9999px"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  section: "5rem"
components:
  button-primary:
    backgroundColor: "{colors.midnight-mirage}"
    textColor: "{colors.praxeti-white}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.midnight-mirage}"
    textColor: "{colors.praxeti-white}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
  button-light:
    backgroundColor: "{colors.praxeti-white}"
    textColor: "{colors.midnight-mirage}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
  book-input:
    backgroundColor: "{colors.praxeti-white}"
    textColor: "{colors.midnight-mirage}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "48px"
  quiet-card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.midnight-mirage}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: Zenvana Hotels

## 1. Overview

**Creative North Star: "The Quiet Considered Stay"**

Zenvana's visual system is editorial hospitality for the Himalayan foothills: serif display type, sand-and-ink neutrals, photography-forward layouts, and restrained accent color. It reads like an Indian boutique hotel that trusts its guests to notice quality without being sold to. Density is calm; whitespace is generous; hierarchy comes from typography scale and photography, not card grids or metric blocks.

The system explicitly rejects OTA clutter, SaaS template residue, luxury cliché (gold gradients, thin gray type over photos), and AI-scaffold patterns (eyebrows on every section, identical icon cards). Reference tone: CGH Earth, Neemrana, Taj boutique properties: heritage warmth with modern legibility.

**Key Characteristics:**

- Serif editorial display (Fraunces) paired with Inter body; Lexend for UI titles
- Sand background (#F6F7ED) with midnight ink (#001F3F) text; spring green (#DBE64C) accent used sparingly
- Pill-shaped CTAs, large corner radii (1rem–1.75rem), soft editorial shadows
- Photography-first heroes with mandatory contrast scrims
- Tier accents (Essential green, Refined sapphire, Signature gold) for property differentiation
- Motion via Framer Motion with full `prefers-reduced-motion` degradation

## 2. Colors

A restrained palette anchored in Dehradun foothill calm: sand neutrals, midnight ink, one spring accent, and editorial gold for premium moments.

### Primary

- **Midnight Mirage** (#001F3F): Primary text, dark buttons, brand authority. The ink that carries headlines and primary CTAs on light surfaces.
- **Book Green** (#00804C): Success states, direct-booking emphasis, conversion CTAs in the booking funnel.

### Secondary

- **Spring Accent** (#DBE64C): Ring focus, dark-mode primary, highlight moments. Used at ≤10% of any screen; its rarity signals importance.
- **Nuit Blanche** (#1E488F): Refined tier, info states, brand gradient mid-tone.

### Tertiary

- **Editorial Gold** (#C8A85A): Signature tier, blog markers, quote borders, reading progress. Never as gradient text on headings.

### Neutral

- **Praxeti White / Sand** (#F6F7ED): Page background in light mode; the calm base, not cream-by-default AI warmth.
- **Ink** (#0A0E1A): Dark mode background; true dark, not blue-painted-dark.
- **Muted Foreground** (#3A4F66): Body copy secondary; bumped from default gray for AA contrast on sand.
- **Card White** (#FFFFFF): Elevated surfaces, popovers, quiet cards.

### Named Rules

**The Scrim Rule.** Text over photography must always sit on a scrim or overlay that guarantees WCAG AA contrast. Never rely on photo luminance or thin gray type.

**The One Accent Rule.** Spring green and editorial gold combined occupy ≤15% of any viewport. If everything is accented, nothing is.

## 3. Typography

**Display Font:** Fraunces (Georgia, serif fallback)
**Body Font:** Inter (system-ui fallback)
**UI Title Font:** Lexend (Inter fallback)

**Character:** Editorial serif warmth for headlines; clean sans for reading and UI. Optical sizing and negative tracking on display type create boutique magazine rhythm without shouting.

### Hierarchy

- **Display** (600, clamp 2rem–3.75rem, 1.1): Hero headlines, property names. `text-wrap: balance`. Letter-spacing ≥ -0.04em.
- **Headline** (600, clamp 1.75rem–2.25rem, 1.2): Section titles, blog h2. Fraunces serif.
- **Title** (500, 1.25rem, 1.4): Subheads, card titles. Lexend.
- **Body** (400, 15–16px, 1.75): Prose, descriptions. Max 65–75ch. `text-wrap: pretty`. Muted foreground only where contrast passes AA.
- **Label** (500, 11px, uppercase, 0.28em tracking): Short section labels only; never on every section (AI eyebrow trap).

### Named Rules

**The Weight Rule.** Body copy never uses font-weight below 400. Ultra-light "luxury" weights are prohibited for guests who need legibility.

**The Serif Ceiling Rule.** Display headings max at clamp 3.75rem (~60px). Above that reads as shouting, not designing.

## 4. Elevation

Hybrid tonal layering with soft editorial shadows. Surfaces are mostly flat at rest; depth appears on hover, sticky bars, and elevated cards.

Default depth is conveyed through background tints (sand → white card) and border opacity, not heavy drop shadows.

### Shadow Vocabulary

- **Soft** (`0 8px 30px rgba(0, 31, 63, 0.08)`): Default card hover, blog cards.
- **Card** (`0 10px 30px rgba(0, 31, 63, 0.10)`): Quiet cards, blog prose images.
- **Editorial** (`0 24px 80px -20px rgba(8, 17, 31, 0.45)`): Hero photography frames, dramatic editorial moments.
- **Gold Glow** (`0 0 0 1px rgba(200, 168, 90, 0.4), 0 18px 60px -25px rgba(200, 168, 90, 0.45)`): Signature tier highlights only.

### Named Rules

**The Flat-By-Default Rule.** Shadows appear as a response to state (hover, sticky, modal), not as permanent decoration on every container.

## 5. Components

### Buttons

- **Shape:** Full pill (9999px radius), 12px vertical / 20px horizontal padding
- **Primary:** Midnight Mirage background, Praxeti White text. Used for "Book your stay", checkout actions.
- **Light / Outline:** Sand or white background, ink text, 1px border at 70% opacity. Secondary actions.
- **Hover / Focus:** Opacity shift or subtle background tint; `focus-visible` outline on primary. No bounce or elastic easing.

### Cards / Containers

- **Corner Style:** 1.5rem–1.75rem (`rounded-[1.5rem]` to `rounded-[1.75rem]`)
- **Background:** White at 80–90% opacity with backdrop blur for `.quiet-card`
- **Shadow Strategy:** Soft at rest, card shadow on hover with slight translate
- **Border:** 1px at 60% border opacity; never a colored side-stripe accent
- **Internal Padding:** 24px standard; section padding via `.section-pad` (3rem mobile, 5rem desktop)

### Inputs / Fields

- **Style:** `.book-input` — 48px height, 1rem radius, sand background at 85% opacity, 1px border
- **Focus:** Ring uses spring accent color via CSS `--ring`
- **Placeholder:** Must meet AA contrast against background (muted-foreground at 32% lightness minimum)

### Navigation

- **Style:** `.site-link` — 14px, slight tracking, foreground at 80% opacity
- **Hover:** Full foreground opacity, no underline animation cliché
- **Mobile:** Sticky booking CTA bar at bottom with safe-area insets; body padding to prevent content occlusion

### Editorial Image

- **Shape:** 1.75rem radius, overflow hidden
- **Hover:** 1.03 scale over 700ms ease-out; disabled under reduced motion
- **Hero overlay:** `.hero-overlay` gradient scrim mandatory when type sits on photography

### Tier Pills

- **Essential:** Mantis green tint
- **Refined:** Sapphire tint
- **Signature:** Gold tint
- Uppercase 10px labels with 0.2em tracking; used for property tier differentiation only

## 6. Do's and Don'ts

### Do:

- **Do** use Fraunces for display headlines and Inter for body; keep hierarchy through scale and weight, not extra font families.
- **Do** apply hero scrims (`.hero-overlay` or equivalent) whenever type sits over photography; verify AA contrast at every breakpoint.
- **Do** lazy-load images and respect variable bandwidth on Indian mobile networks.
- **Do** provide full keyboard and screen-reader paths through date picker → room select → checkout.
- **Do** degrade all Framer Motion, marquee, and parallax to instant/crossfade under `prefers-reduced-motion`.
- **Do** use spring accent and gold sparingly; let photography and typography carry the brand.

### Don't:

- **Don't** use OTA-style price-first grids, cluttered filter bars, or impersonal listing cards.
- **Don't** ship SaaS template patterns: gradient heroes, metric blocks, identical icon-card grids, software-marketing copy.
- **Don't** use luxury cliché: gold gradient text (`background-clip: text`), marble textures, all-caps "LUXURY EXPERIENCE", thin gray type over photos.
- **Don't** add eyebrow kickers ("ABOUT", "PROCESS") above every section or numbered scaffolding (01 / 02 / 03) without informational purpose.
- **Don't** use side-stripe borders (`border-left` > 1px colored accent) on cards or alerts.
- **Don't** gate content visibility on animation classes; reveals must enhance already-visible defaults.
- **Don't** use glassmorphism or backdrop blur as default decoration; `.quiet-card` blur is the exception, not the rule.
- **Don't** default to cream/sand AI warmth as the only brand move; sand here is a named brand token (#F6F7ED), not generic near-white.
