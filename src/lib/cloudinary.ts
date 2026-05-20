import { v2 as cloudinary } from 'cloudinary'

function requireCloudinaryEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name} environment variable`)
  }
  return value
}

let configured = false

export function getCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: requireCloudinaryEnv('CLOUDINARY_CLOUD_NAME'),
      api_key: requireCloudinaryEnv('CLOUDINARY_API_KEY'),
      api_secret: requireCloudinaryEnv('CLOUDINARY_API_SECRET'),
      secure: true,
    })
    configured = true
  }
  return cloudinary
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  )
}
