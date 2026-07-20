import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const pageSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'page.tsx'),
  'utf8',
)
const skeletonSource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '../../../../components/skeletons/HotelSkeletons.tsx',
  ),
  'utf8',
)
const readMoreSource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '../../../../components/ReadMoreText.tsx',
  ),
  'utf8',
)

describe('property hero layout contract', () => {
  it('keeps all hero media landscape in an intrinsic right-third column', () => {
    expect(pageSource).toContain(
      'lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]',
    )
    expect(pageSource).toContain('function HeroFacts')
    expect(pageSource).toContain('group relative aspect-video')
    expect(pageSource).not.toContain('lg:aspect-[4/5]')
    expect(pageSource).not.toContain('<QuickFacts')
  })

  it('matches the live hero structure in its loading skeleton', () => {
    expect(skeletonSource).toContain(
      'lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]',
    )
    expect(skeletonSource).toContain('aspect-video')
    expect(skeletonSource).toContain('grid grid-cols-2 gap-px')
    expect(skeletonSource).not.toContain('min-h-[76svh]')
  })

  it('limits the mobile hero description to two lines with expansion', () => {
    expect(pageSource).toContain('collapsedClassName="max-h-[3.4rem]"')
    expect(pageSource).toContain('gradientClassName="hidden"')
    expect(pageSource).toContain('buttonClassName="text-foreground/80')
    expect(readMoreSource).toContain('gradientClassName')
    expect(readMoreSource).toContain('buttonClassName')
  })

  it('uses semantic light-theme surfaces and concise availability copy', () => {
    expect(pageSource).toContain(
      'bg-background text-foreground dark:bg-[#06080d] dark:text-white',
    )
    expect(skeletonSource).toContain('bg-background dark:bg-[#06080d]')
    expect(pageSource).not.toContain('Check overnight availability')
    expect(
      pageSource.match(/Check availability/g)?.length,
    ).toBeGreaterThanOrEqual(3)
  })
})
