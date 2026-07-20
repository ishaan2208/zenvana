# Campaign & Interakt tracking convention

Zenvana first-party analytics attributes sessions from URL params captured on first hit (and last-touch on return visits).

## Interakt / WhatsApp campaigns

### Post-checkout coupon (automatic)

PMS checkout already sends `zenvana_post_checkout_coupon_en` via Interakt. The CTA button dynamic suffix is now:

```
{couponCode}&utm_source=whatsapp&utm_medium=interakt&utm_campaign=post_checkout_coupon&utm_content={propertySlug}
```

**Interakt template requirement:** the button base URL must end with `couponCode=` (e.g. `https://www.zenvanahotels.com/hotels?couponCode=`). Final link becomes:

```
https://www.zenvanahotels.com/hotels?couponCode=ZVPOST123&utm_source=whatsapp&utm_medium=interakt&utm_campaign=post_checkout_coupon&utm_content=rosewood
```

Those visits show under **Acquisition → Campaigns** as `post_checkout_coupon`.

### Other Interakt / WhatsApp campaigns (manual)

Put tracked links in templates:

```
https://www.zenvanahotels.com/hotels/your-property?utm_source=whatsapp&utm_medium=interakt&utm_campaign=summer_escape_jul26
```

Optional extras:

- `utm_content` — creative variant or property slug
- `utm_term` — audience segment

## Ads

- Google Ads: keep auto-tagging (`gclid`) — channel becomes `google-ads`
- Meta: keep `fbclid` — channel becomes `meta`

## What counts as a conversion

Completed booking (`booking_completed`). WhatsApp / phone clicks are intent signals, not conversions.

## Blog authors

Set the **Author** field on each post in `/internal/blogs-admin`. Dashboard → **Blog** shows per-author views, engagement, CTAs, and blog-assisted bookings.
