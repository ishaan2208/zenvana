import { BlogMediaType } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { getBlogAdminSession } from '@/lib/blogAdminAuth'
import { getCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!(await getBlogAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: 'Cloudinary is not configured' }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const isVideo = file.type.startsWith('video/')
  const folder = 'zenvana/blog'

  try {
    const cloudinary = getCloudinary()
    const result = await new Promise<{
      secure_url: string
      public_id: string
      width?: number
      height?: number
      duration?: number
      resource_type: string
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: isVideo ? 'video' : 'image',
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error('Upload failed'))
            return
          }
          resolve(uploadResult)
        },
      )
      uploadStream.end(bytes)
    })

    return NextResponse.json({
      type: isVideo ? BlogMediaType.VIDEO : BlogMediaType.IMAGE,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width ?? null,
      height: result.height ?? null,
      duration: result.duration ?? null,
    })
  } catch (error) {
    console.error('Cloudinary upload failed', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
