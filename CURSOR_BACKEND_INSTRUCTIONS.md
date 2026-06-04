# Backend + Admin (web1) instructions — property-page data

> Written for the **backend API** repo and the **web1 admin panel** (where property
> public profiles are configured). The Zenvana marketing site (this repo) already
> consumes these fields defensively: everything below degrades gracefully when the
> data is absent, so you can ship the frontend now and light these up incrementally.
>
> Frontend contract lives in `src/lib/api.ts` (`PublicPropertyDetail`) and
> `src/lib/media.ts` (`GalleryImage`). Match those shapes.

---

## 1. Photo classification + tags (powers the gallery filter chips)

**Why:** the property gallery now renders **filter chips** (`FilterableGallery.tsx`)
derived from each image's `classification` and `tags`. Today most images have
neither, so the chips don't show. Populate them and the filter appears automatically.

**Public API** — each image object in `property.images[]` should expose:

```jsonc
{
  "url": "https://...",
  "isHero": true,                 // already supported
  "sortOrder": 0,                 // already supported
  "classification": "room",       // ADD — single primary bucket
  "tags": ["deluxe", "balcony"]   // ADD — optional free tags
}
```

- `classification`: one of a controlled vocabulary — suggest
  `hero | room | suite | bathroom | lobby | dining | exterior | rooftop | view | amenity | event`.
  (The value `hero` is reserved and is excluded from the filter chips.)
- `tags`: optional, lowercase, free-form. Both are already parsed by `lib/media.ts`.

**Admin (web1):** in the property image manager, add a **Classification** dropdown
(controlled list above) and a **Tags** multi-input per image. Bulk-classify is a nice-to-have.
Persist on the image record; include both in the public properties API response.

---

## 2. Nearby places + distances (powers the "Getting here" section)

**Why:** the property page now has a **Getting here / Around the corner** section
(`src/lib/distances.ts` + `GettingHereSection` in the property page). It currently
uses a **brand-wide curated anchor list** (railway station, ISBT, Jolly Grant
airport, Mussoorie, plus a few attractions) and computes straight-line distance
from each property's `latitude`/`longitude`. Drive times are the operator-stated
Rajpur Road figures. This is accurate enough for the corridor but **not editable
per property**.

**To make it per-property accurate and editable**, add an optional `nearbyPlaces`
array to the public property profile:

```jsonc
"nearbyPlaces": [
  {
    "name": "Dehradun Railway Station",
    "category": "Railway",          // Airport | Railway | Bus terminal | Hill station | Shopping | Nature | Heritage | City centre | ...
    "kind": "transit",              // "transit" | "nearby"
    "lat": 30.3165,                 // optional — enables straight-line km if distanceKm absent
    "lng": 78.0322,
    "distanceKm": 7.2,              // optional — overrides computed km
    "driveTime": "20–25 min"        // optional — transit rows show this
  }
]
```

Frontend rule when wiring this in (small follow-up in `distances.ts`): if
`property.nearbyPlaces` is present and non-empty, use it; otherwise fall back to
the curated anchor set. `distanceKm` wins over computed Haversine; `driveTime`
renders verbatim.

**Admin (web1):** a repeatable **Nearby places** editor on the property profile —
name, category (select), kind (transit/nearby toggle), optional lat/lng, optional
distance, optional drive-time. Seed each property with the four transit hubs so
editors only tweak values.

**Optional upgrade:** compute real drive time/distance once per property via a
routing/distance-matrix API (Google Distance Matrix, OSRM, Mapbox) at save time and
cache `distanceKm` + `driveTime` on the record. Avoids per-request API cost.

---

## 3. Per-property SEO fields (optional but recommended)

The property page builds `generateMetadata` from `publicName` / `descriptionShort` /
`city`. To control SEO precisely per property, add optional public fields mirroring
the blog model: `seoTitle`, `seoDescription`, `ogImageUrl`. Frontend will prefer
these when present and fall back to the current derivation.

---

## 4. Not backend — frontend-only (no action needed here)

For reference, these were handled in the marketing repo and need **no** backend work:

- Flying-plane "request sent" CTA (`PlaneButton.tsx`) on next-page booking buttons.
- Removal of AI-tell blocks ("Trust by design", photo counts) and the new orientation copy.
- Reduced-motion handling, press feedback, Vaul mobile booking sheet.

---

## Acceptance checklist

- [ ] Public properties API returns `classification` + `tags` on each image.
- [ ] web1 admin can set image classification (controlled list) + tags.
- [ ] Public property API returns optional `nearbyPlaces[]` per the shape above.
- [ ] web1 admin has a Nearby-places editor, seeded with the 4 transit hubs.
- [ ] (Optional) `seoTitle` / `seoDescription` / `ogImageUrl` on the property profile.
- [ ] (Optional) cached drive-time/distance via a routing API at save time.
