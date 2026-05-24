/** Accept `couponCode` or `promoCode` (same discount code, different query param names). */
export function promoOrCouponFromSearchParams(q: {
  couponCode?: string | string[]
  promoCode?: string | string[]
}): string {
  const raw = String(
    firstSearchParam(q.couponCode) ?? firstSearchParam(q.promoCode) ?? '',
  ).trim()
  return raw ? raw.toUpperCase() : ''
}

function firstSearchParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined
  const s = Array.isArray(v) ? v[0] : v
  return s === undefined ? undefined : String(s)
}
