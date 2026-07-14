/**
 * Hourly-stay kind URL param helpers.
 *
 * New URLs say `stayKind=hourly`; the `stayKind=dayuse` value from a brief
 * naming experiment is accepted forever so any links minted with it keep
 * working. The backend API keeps its own `stayKind: 'HOURLY'` payload value —
 * this module only concerns the zenvana URL layer.
 */

/** Param value used when building new hourly-stay URLs. */
export const DAY_USE_STAY_KIND_PARAM = 'hourly'

/** True when a `stayKind` query param denotes a day-use (formerly hourly) stay. */
export function isDayUseParam(
  value: string | string[] | undefined | null,
): boolean {
  const single = Array.isArray(value) ? value[0] : value
  const normalized = String(single ?? '').toLowerCase()
  return normalized === 'dayuse' || normalized === 'hourly'
}
