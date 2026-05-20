import {
  describeAllowedTypes,
  describeMaxSize,
  formatBytes,
  getBlogImageSpec,
  type BlogImageRole,
  type BlogImageSpec,
} from '@/lib/blogImageSpecs'

export type ImageValidationIssue = {
  severity: 'warn' | 'fail'
  code:
    | 'wrong-type'
    | 'too-large'
    | 'too-small-dimensions'
    | 'too-large-dimensions'
    | 'wrong-aspect'
    | 'missing-alt'
  message: string
}

export type ImageValidationResult = {
  ok: boolean
  fatal: boolean
  width?: number
  height?: number
  bytes: number
  mimeType: string
  ratio?: number
  issues: ImageValidationIssue[]
}

export type ValidateImageInput = {
  role: BlogImageRole
  file: { type: string; size: number; name?: string }
  dimensions?: { width: number; height: number }
  altText?: string
}

/**
 * Pure-TS validator used by both the browser (pre-upload) and the
 * Cloudinary route (post-upload). Doesn't touch the filesystem or
 * window — safe to call from any runtime.
 */
export function validateBlogImage(input: ValidateImageInput): ImageValidationResult {
  const spec = getBlogImageSpec(input.role)
  const issues: ImageValidationIssue[] = []

  // MIME type
  if (!spec.allowedMimeTypes.includes(input.file.type as (typeof spec.allowedMimeTypes)[number])) {
    issues.push({
      severity: 'fail',
      code: 'wrong-type',
      message: `${input.file.type || 'unknown type'} not allowed for ${spec.label}. Use ${describeAllowedTypes(
        spec.allowedMimeTypes,
      )}.`,
    })
  }

  // File size
  if (input.file.size > spec.maxBytes) {
    issues.push({
      severity: 'fail',
      code: 'too-large',
      message: `File is ${formatBytes(input.file.size)} — limit is ${describeMaxSize(
        spec.maxBytes,
      )}. Re-export at lower quality or use a smaller crop.`,
    })
  }

  // Dimensions + aspect
  let ratio: number | undefined
  if (input.dimensions) {
    const { width, height } = input.dimensions
    ratio = width / height

    if (width < spec.minimum.width || height < spec.minimum.height) {
      issues.push({
        severity: 'fail',
        code: 'too-small-dimensions',
        message: `Image is ${width}×${height}. Minimum for ${spec.label} is ${spec.minimum.width}×${spec.minimum.height}.`,
      })
    } else if (width > spec.maximum.width || height > spec.maximum.height) {
      issues.push({
        severity: 'warn',
        code: 'too-large-dimensions',
        message: `Image is ${width}×${height}. We’ll downscale to ≤ ${spec.maximum.width}×${spec.maximum.height} for performance.`,
      })
    }

    if (spec.aspectTolerance < 1) {
      const drift = Math.abs(ratio - spec.aspectRatio) / spec.aspectRatio
      if (drift > spec.aspectTolerance) {
        issues.push({
          severity: 'fail',
          code: 'wrong-aspect',
          message: `Aspect ratio is ${ratio.toFixed(2)}:1 — needs to be ${spec.aspectLabel} (±${Math.round(
            spec.aspectTolerance * 100,
          )}%). Re-crop before uploading.`,
        })
      }
    }
  }

  // Alt text
  if (spec.altTextRequired && (!input.altText || input.altText.trim().length < 4)) {
    issues.push({
      severity: 'fail',
      code: 'missing-alt',
      message: 'Alt text is required for accessibility and SEO. Describe what the image shows.',
    })
  }

  const fatal = issues.some((issue) => issue.severity === 'fail')

  return {
    ok: !fatal,
    fatal,
    width: input.dimensions?.width,
    height: input.dimensions?.height,
    bytes: input.file.size,
    mimeType: input.file.type,
    ratio,
    issues,
  }
}

/** Browser-only: read pixel dimensions from a File via an ObjectURL. */
export async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof URL === 'undefined') {
      reject(new Error('readImageDimensions can only run in the browser'))
      return
    }
    const objectUrl = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read image dimensions'))
    }
    img.src = objectUrl
  })
}

/** Summary string for showing a spec on the upload tile (e.g. "16:9 · 2400×1350 · max 4 MB"). */
export function describeSpec(spec: BlogImageSpec): string {
  return [
    spec.aspectLabel,
    `${spec.recommended.width}×${spec.recommended.height}`,
    `max ${describeMaxSize(spec.maxBytes)}`,
  ].join(' · ')
}
