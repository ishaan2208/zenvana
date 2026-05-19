import { HeroBookBar, type HeroBookBarProperty } from './HeroBookBar'

/**
 * Keep a stable initial layout by rendering the booking bar immediately.
 * Deferring this mount caused a measurable first-frame layout shift.
 */
export function HeroBookBarDeferred({ properties }: { properties: HeroBookBarProperty[] }) {
  return <HeroBookBar properties={properties} />
}
