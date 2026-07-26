/**
 * Guest-facing copy for the backend's price-guard rejections.
 *
 * The backend re-prices every booking from its own rate chart and refuses to
 * charge a total the browser made up. That surfaces here as a handful of codes;
 * each one needs a message that tells the guest what to do next rather than
 * exposing that a validation fired.
 */
const PRICE_GUARD_MESSAGES: Record<string, string> = {
  PRICE_CHANGED:
    'Room rates have changed since you started. Please review the updated total and confirm.',
  NO_RATE_AVAILABLE:
    "We can't price these dates right now. Please try different dates or contact the property.",
  RATE_PLAN_NOT_FOUND:
    'That rate is no longer available. Please go back and reselect your room.',
  ORDER_REQUIRED:
    "We couldn't find the payment order for this checkout. If you were charged, your booking will be confirmed automatically — please contact the property with your payment reference.",
  HOURLY_ORDER_REQUIRED:
    'This day-use checkout has expired. Please start again from the rooms page.',
  QUOTE_STALE:
    'Rates have changed since this quote was generated. Please review the updated total and try again.',
}

/** True for codes whose response carries fresh server totals worth re-rendering. */
export function isPriceGuardCode(code?: string): boolean {
  return Boolean(code && code in PRICE_GUARD_MESSAGES)
}

export function priceGuardErrorMessage(
  code?: string,
  fallback?: string,
): string {
  if (!code) return fallback ?? 'We could not confirm the price for this booking'
  return (
    PRICE_GUARD_MESSAGES[code] ??
    fallback ??
    'We could not confirm the price for this booking'
  )
}

/**
 * Message for a PRICE_CHANGED rejection, naming the new total so the guest can
 * decide before the second attempt charges it.
 */
export function priceChangedMessage(serverTotal?: number): string {
  if (typeof serverTotal !== 'number' || !Number.isFinite(serverTotal)) {
    return PRICE_GUARD_MESSAGES.PRICE_CHANGED
  }
  const formatted = serverTotal.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })
  return `Room rates have changed since you started. The total is now ₹${formatted} — please review and confirm.`
}

export const PRICE_CHANGED_TOAST_ID = 'zenvana-checkout-price-changed'
