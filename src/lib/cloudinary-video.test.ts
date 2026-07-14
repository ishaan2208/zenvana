import { describe, expect, it } from 'vitest'

import {
  deriveVideoPreviewUrl,
  formatVideoDuration,
  resizeVideoPosterUrl,
  secondsToIsoDuration,
} from './cloudinary-video'

describe('resizeVideoPosterUrl', () => {
  const poster =
    'https://res.cloudinary.com/demo/video/upload/so_auto,w_1280,q_auto,f_jpg/zenvana/public/property/1/videos/walkthrough_abc.jpg'

  it('swaps the width transform', () => {
    expect(resizeVideoPosterUrl(poster, 640)).toContain('so_auto,w_640,q_auto')
  })

  it('rounds fractional widths', () => {
    expect(resizeVideoPosterUrl(poster, 639.6)).toContain('w_640')
  })

  it('leaves URLs without a width transform unchanged', () => {
    const noWidth =
      'https://res.cloudinary.com/demo/video/upload/so_auto,q_auto,f_jpg/id.jpg'
    expect(resizeVideoPosterUrl(noWidth, 640)).toBe(noWidth)
  })

  it('leaves non-video URLs unchanged', () => {
    const image =
      'https://res.cloudinary.com/demo/image/upload/w_1280/photo.jpg'
    expect(resizeVideoPosterUrl(image, 640)).toBe(image)
  })
})

describe('deriveVideoPreviewUrl', () => {
  const playback =
    'https://res.cloudinary.com/demo/video/upload/q_auto,f_auto:video,h_720,c_limit/zenvana/public/property/1/videos/walkthrough_abc.mp4'

  it('replaces the transform segment with preview caps', () => {
    const url = deriveVideoPreviewUrl(playback, {
      maxHeight: 360,
      maxDurationSec: 10,
    })
    expect(url).toBe(
      'https://res.cloudinary.com/demo/video/upload/q_auto:eco,f_auto:video,h_360,c_limit,ac_none,so_0,du_10/zenvana/public/property/1/videos/walkthrough_abc.mp4',
    )
  })

  it('omits duration transforms when no cap given', () => {
    const url = deriveVideoPreviewUrl(playback, { maxHeight: 540 })
    expect(url).toContain('h_540,c_limit,ac_none/')
    expect(url).not.toContain('du_')
  })

  it('supports full quality tier', () => {
    expect(
      deriveVideoPreviewUrl(playback, { maxHeight: 540, quality: 'auto' }),
    ).toContain('/q_auto,f_auto:video')
  })

  it('prepends transforms when the URL has none (secureUrl fallback)', () => {
    const bare =
      'https://res.cloudinary.com/demo/video/upload/v123/zenvana/public/property/1/videos/walkthrough_abc.mp4'
    const url = deriveVideoPreviewUrl(bare, { maxHeight: 360 })
    expect(url).toContain(
      '/video/upload/q_auto:eco,f_auto:video,h_360,c_limit,ac_none/v123/',
    )
  })

  it('passes non-cloudinary URLs through untouched', () => {
    expect(
      deriveVideoPreviewUrl('https://example.com/x.mp4', { maxHeight: 360 }),
    ).toBe('https://example.com/x.mp4')
  })
})

describe('secondsToIsoDuration', () => {
  it('formats minutes and seconds', () => {
    expect(secondsToIsoDuration(95)).toBe('PT1M35S')
  })

  it('formats hours', () => {
    expect(secondsToIsoDuration(3600)).toBe('PT1H')
  })

  it('handles zero', () => {
    expect(secondsToIsoDuration(0)).toBe('PT0S')
  })

  it('rounds fractional seconds', () => {
    expect(secondsToIsoDuration(59.6)).toBe('PT1M')
  })
})

describe('formatVideoDuration', () => {
  it('formats m:ss', () => {
    expect(formatVideoDuration(95)).toBe('1:35')
    expect(formatVideoDuration(9)).toBe('0:09')
  })
})
