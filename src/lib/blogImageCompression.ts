'use client'

import imageCompression from 'browser-image-compression'

import type { BlogImageSpec } from '@/lib/blogImageSpecs'

export type CompressionResult = {
  file: File
  /** Did we actually replace the original? */
  changed: boolean
  /** Notes worth showing the editor in the pre-upload card. */
  notes: string[]
}

/**
 * Compress an image client-side before it leaves the browser. Strips EXIF,
 * downscales to the spec's recommended width, and converts to JPEG by default
 * (the format with the smallest file size for photographs and the broadest
 * browser/CDN support). PNGs with real transparency are left as PNG.
 *
 * If the file is already smaller than the spec target we leave it alone —
 * compressing an already-small file just wastes bytes (and quality).
 */
export async function compressBlogImage(
  file: File,
  spec: BlogImageSpec,
): Promise<CompressionResult> {
  const notes: string[] = []

  // Heuristic: PNG over 200 KB is almost always a photo that should be JPEG.
  const isLikelyOpaquePhoto =
    file.type === 'image/png' && file.size > 200 * 1024
  const wantJpeg =
    !spec.allowTransparency || isLikelyOpaquePhoto || file.type === 'image/jpeg'

  const desiredMimeType = wantJpeg ? 'image/jpeg' : file.type
  const targetBytes = Math.min(spec.maxBytes, 800 * 1024) // 0.8 MB sweet spot for photographs
  const targetMB = targetBytes / 1024 / 1024

  // Don't bother compressing files already under the target.
  if (file.size <= targetBytes && desiredMimeType === file.type) {
    return { file, changed: false, notes: ['Already within target size — uploaded as-is.'] }
  }

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: targetMB,
      maxWidthOrHeight: spec.recommended.width,
      useWebWorker: true,
      fileType: desiredMimeType,
      initialQuality: 0.82,
      alwaysKeepResolution: false,
    })

    // browser-image-compression returns a Blob — normalize to File with the
    // right extension so backends that read the extension behave correctly.
    const ext = desiredMimeType === 'image/jpeg' ? 'jpg' : desiredMimeType.split('/')[1] || 'bin'
    const newName = file.name.replace(/\.[^.]+$/, '') + '.' + ext
    const optimized = new File([compressed], newName, {
      type: desiredMimeType,
      lastModified: Date.now(),
    })

    const savedPct = Math.round(((file.size - optimized.size) / file.size) * 100)
    if (savedPct > 0) {
      notes.push(`Compressed by ${savedPct}% (${formatBytes(file.size)} → ${formatBytes(optimized.size)}).`)
    }
    if (wantJpeg && file.type !== 'image/jpeg') {
      notes.push('Converted to JPEG for faster delivery.')
    }
    return { file: optimized, changed: optimized.size !== file.size, notes }
  } catch {
    // Compression should never block the writer — fall back to the original.
    notes.push('Could not optimize — uploading the original file.')
    return { file, changed: false, notes }
  }
}

function formatBytes(bytes: number): string {
  const MB = 1024 * 1024
  if (bytes >= MB) return `${(bytes / MB).toFixed(bytes >= 10 * MB ? 0 : 1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}
