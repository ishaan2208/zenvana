/**
 * Splits a total amount (inclusive of tax) into base + tax for display.
 * Uses 5% GST on base: base = total / 1.05, tax = total - base.
 * So e.g. 800 → { base: 762, tax: 38 } (rounded so base + tax === total).
 */
const TAX_RATE = 0.05

export function splitTotalIntoBaseAndTax(total: number): {
  base: number
  tax: number
} {
  const base = Math.round((total / (1 + TAX_RATE)) * 100) / 100
  const tax = Math.round((total - base) * 100) / 100
  return { base, tax }
}

export function formatPrice(value: number, locale = 'en-IN'): string {
  return value.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
}
