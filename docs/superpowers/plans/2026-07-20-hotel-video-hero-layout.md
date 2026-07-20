# Hotel Video Hero Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the property hero so hotel information occupies two-thirds of the desktop composition and the walkthrough film occupies a compact right third, with a balanced mobile-first stack.

**Architecture:** Keep the work inside the existing server-rendered property page and reuse `AmbientVideo`, `CloudinaryImage`, `PlaneButton`, and the current data model. Move the existing quick facts into a reusable hero-local facts grid, then replace the film-first full-width hero branch with one intrinsic responsive grid.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Cloudinary media helpers, Lucide icons.

## Global Constraints

- Preserve booking URLs, coupon propagation, structured data, map links, phone links, and the mobile sticky booking bar.
- Preserve poster-first video loading, reduced-motion, Save-Data, and off-screen pause behavior.
- Mobile is one column; desktop uses `minmax(0, 2fr) minmax(18rem, 1fr)`.
- Interactive targets remain at least 44px and dark-hero text must retain WCAG AA contrast.
- Do not add dependencies or fixed content heights.

---

### Task 1: Recompose the property hero

**Files:**
- Modify: `src/app/(marketing)/hotels/[slug]/page.tsx:220-680`

**Interfaces:**
- Consumes: `Property`, `PublicPropertyVideo`, `AmbientVideo`, `resizeVideoPosterUrl`, `deriveVideoPreviewUrl`
- Produces: `HeroFacts({ property, location })` and the revised `PropertyHero`

- [ ] **Step 1: Capture the expected source-level layout contract**

Before editing, verify that the current page contains the full-width film and separate facts stripe:

```bash
rg -n "aspect-video w-full|<QuickFacts|function QuickFacts" "src/app/(marketing)/hotels/[slug]/page.tsx"
```

Expected: matches for all three legacy structures.

- [ ] **Step 2: Replace the full-width hero branch with the intrinsic 2:1 composition**

In `PropertyHero`, create one mobile-first grid and move the identity block into its left column:

```tsx
<div className="grid gap-8 pb-12 pt-8 sm:gap-10 sm:pb-16 sm:pt-12 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:items-center lg:gap-12 lg:pb-20">
  <div className="min-w-0">
    {/* property name, metadata, description, actions */}
    <HeroFacts property={property} location={location} />
  </div>
  <div className="min-w-0 lg:justify-self-end">
    {/* compact walkthrough or still-image fallback */}
  </div>
</div>
```

Use `aspect-[4/3]` on mobile and `lg:aspect-[4/5]` on the film container. Keep the poster and both cost-capped `AmbientVideo` sources. Set responsive image sizing to reflect the new right-column width.

- [ ] **Step 3: Add the compact hero facts grid**

Replace `QuickFacts` with a hero-local component:

```tsx
function HeroFacts({ property, location }: { property: Property; location: string }) {
  const items = [
    { icon: Plane, label: 'Airport', value: '≈ 45 min' },
    { icon: Train, label: 'Railway', value: '20–25 min' },
    { icon: BedDouble, label: 'Room types', value: `${property.roomTypes?.length ?? 0}` },
    { icon: MapPin, label: 'Setting', value: location },
  ]

  return (
    <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 bg-[#080b11]/90 p-4 sm:p-5">
          {/* icon, dt, and content-sized dd */}
        </div>
      ))}
    </dl>
  )
}
```

Use `min-w-0`, wrapping values, and optical icon alignment. Do not truncate the location.

- [ ] **Step 4: Add restrained interaction and focus states**

Apply `group`, `transition`, `duration-500`, and the existing ease-out motion language to the film frame. On hover-capable devices, scale the video/poster no more than `1.02`, translate directional icons by at most `0.5` Tailwind units, and expose `focus-visible` rings on links. Use `motion-reduce:transform-none motion-reduce:transition-none`.

- [ ] **Step 5: Remove duplicate hero facts rendering**

Delete the `<QuickFacts ... />` call after `PropertyHero` and remove the old `QuickFacts` function. Keep `QuickAnchorNav` immediately after the hero.

- [ ] **Step 6: Verify the layout contract changed**

```bash
rg -n "lg:grid-cols-\\[minmax\\(0,2fr\\)_minmax\\(18rem,1fr\\)\\]|function HeroFacts|aspect-video w-full|<QuickFacts" "src/app/(marketing)/hotels/[slug]/page.tsx"
```

Expected: the new grid and `HeroFacts` match; the legacy full-width film and `QuickFacts` call do not.

- [ ] **Step 7: Run static verification**

```bash
npx prettier --check "src/app/(marketing)/hotels/[slug]/page.tsx" && npx tsc --noEmit
```

Expected: both commands exit 0.

- [ ] **Step 8: Verify in the browser**

Run `npm run dev`, open a property with a walkthrough, and inspect:

- 390px: information → 4:3 film → 2×2 facts, with no overflow or sticky-bar overlap.
- 768px: balanced single-column composition with intrinsic spacing.
- 1280px and 1440px: approximately two-thirds information and one-third portrait film.
- Reduced motion: no media scaling or translated controls.
- No-walkthrough property: still-image fallback occupies the same right-column container.

Expected: no horizontal overflow, text clipping, layout shift, inaccessible focus state, or full-width video.

