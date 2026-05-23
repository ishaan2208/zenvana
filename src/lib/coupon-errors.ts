const COUPON_MESSAGES: Record<string, string> = {
  COUPON_NOT_FOUND: 'Coupon code not found.',
  COUPON_INACTIVE: 'This coupon is inactive.',
  COUPON_NOT_STARTED: 'This coupon is not active yet.',
  COUPON_EXPIRED: 'This coupon has expired.',
  COUPON_SCOPE_MISMATCH: 'This coupon does not apply to this hotel.',
  COUPON_MIN_AMOUNT_NOT_MET: 'Your booking total does not meet the minimum for this coupon.',
  COUPON_MIN_NIGHTS_NOT_MET: 'Your stay is shorter than the minimum nights for this coupon.',
  COUPON_USAGE_LIMIT_REACHED: 'This coupon has reached its usage limit.',
  COUPON_POINTS_CONFLICT: 'Points and coupon cannot be used together.',
  COUPON_LOGIN_REQUIRED: 'Please login or register to use this coupon.',
  COUPON_IDENTITY_REQUIRED: 'Please provide a valid phone number or login to use this coupon.',
  COUPON_PHONE_MISMATCH: 'Checkout phone must match your account phone for this coupon.',
  COUPON_ALREADY_REDEEMED: 'You have already used this coupon.',
  COUPON_NEW_GUEST_ONLY: 'This coupon is only for first-time guests.',
  COUPON_REPEAT_GUEST_ONLY: 'This coupon is only for returning guests.',
  COUPON_TAGS_REQUIRED: 'You are not eligible for this coupon.',
};

export function couponErrorMessage(reason?: string, fallback?: string): string {
  if (!reason) return fallback ?? 'Coupon could not be applied';
  return COUPON_MESSAGES[reason] ?? fallback ?? 'Coupon could not be applied';
}
