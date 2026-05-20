import { BlogMediaType } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { getBlogAdminSession } from '@/lib/blogAdminAuth'
import { getCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'
import {
  BLOG_IMAGE_SPECS,
  getBlogImageSpec,
  isBlogImageRole,
  type BlogImageRole,
} from '@/lib/blogImageSpecs'
import { validateBlogImage } from '@/lib/blogImageValidation'

export const runtime = 'nodejs'

type CloudinaryUploadResult = {
  secure_url: string
  public_id: string
  width?: number
  height?: number
  duration?: number
  bytes?: number
  format?: string
  resource_type: string
}

export async function POST(request: NextRequest) {
  if (!(await getBlogAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: 'Cloudinary is not configured' }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const roleInput = String(formData.get('role') || 'GALLERY')
  const widthHint = Number(formData.get('width') || 0) || undefined
  const heightHint = Number(formData.get('height') || 0) || undefined

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  const isVideo = file.type.startsWith('video/')
  const role: BlogImageRole = isBlogImageRole(roleInput) ? roleInput : 'GALLERY'

  // Videos skip the strict image spec gate but still get a sane size cap.
  if (isVideo) {
    const VIDEO_MAX_BYTES = 30 * 1024 * 1024
    if (file.size > VIDEO_MAX_BYTES) {
      return NextResponse.json(
        { error: `Video too large — limit is ${VIDEO_MAX_BYTES / 1024 / 1024} MB.` },
        { status: 413 },
      )
    }
  } else {
    // Server-side guard rail. The client validator runs first, but we don't trust it.
    const spec = getBlogImageSpec(role)
    const validation = validateBlogImage({
      role,
      file: { type: file.type, size: file.size, name: file.name },
      dimensions: widthHint && heightHint ? { width: widthHint, height: heightHint } : undefined,
      altText: 'placeholder', // alt text lives on the registration step, not upload
    })

    const fatalIssue = validation.issues.find(
      (issue) => issue.severity === 'fail' && issue.code !== 'missing-alt',
    )
    if (fatalIssue) {
      return NextResponse.json(
        {
          error: fatalIssue.message,
          code: fatalIssue.code,
          spec: {
            label: spec.label,
            aspectLabel: spec.aspectLabel,
            recommended: spec.recommended,
            maximum: spec.maximum,
            maxBytes: spec.maxBytes,
          },
        },
        { status: 422 },
      )
    }
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const spec = !isVideo ? BLOG_IMAGE_SPECS[role] : undefined
  const folder = spec?.cloudinaryFolder ?? (isVideo ? 'zenvana/blog/video' : 'zenvana/blog/gallery')
  const transformation = spec?.cloudinaryTransformation

  try {
    const cloudinary = getCloudinary()
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: isVideo ? 'video' : 'image',
          // `transformation` is applied at upload-time so we store an
          // already-optimized asset (avoids on-the-fly transforms at request time).
          transformation: transformation ? [{ raw_transformation: transformation }] : undefined,
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error('Upload failed'))
            return
          }
          resolve(uploadResult as CloudinaryUploadResult)
        },
      )
      uploadStream.end(bytes)
    })

    return NextResponse.json({
      type: isVideo ? BlogMediaType.VIDEO : BlogMediaType.IMAGE,
      role,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width ?? null,
      height: result.height ?? null,
      bytes: result.bytes ?? file.size,
      format: result.format ?? null,
      duration: result.duration ?? null,
    })
  } catch (error) {
    console.error('Cloudinary upload failed', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
