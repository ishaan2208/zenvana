import { cookies } from 'next/headers'

export const BLOG_ADMIN_PASSWORD =
  process.env.BLOG_ADMIN_PASSWORD?.trim() || 'admin123'
export const BLOG_ADMIN_COOKIE = 'zenvana_blog_admin'
export const BLOG_ADMIN_COOKIE_VALUE = 'authorized'
const BLOG_ADMIN_MAX_AGE_SECONDS = 60 * 60 * 8

export function isBlogAdminAuthorized(cookieValue: string | undefined): boolean {
  return cookieValue === BLOG_ADMIN_COOKIE_VALUE
}

/** Secure only on HTTPS deployments — not on local `next start` over http:// */
export function shouldUseSecureBlogAdminCookie(): boolean {
  if (process.env.BLOG_ADMIN_COOKIE_SECURE === 'false') return false
  if (process.env.BLOG_ADMIN_COOKIE_SECURE === 'true') return true
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  if (siteUrl.startsWith('https://')) return true
  return process.env.VERCEL === '1'
}

export function getBlogAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: BLOG_ADMIN_MAX_AGE_SECONDS,
    secure: shouldUseSecureBlogAdminCookie(),
  }
}

export async function getBlogAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  return isBlogAdminAuthorized(cookieStore.get(BLOG_ADMIN_COOKIE)?.value)
}

export function buildBlogAdminCookieHeader(): string {
  const secure = shouldUseSecureBlogAdminCookie() ? '; Secure' : ''
  return `${BLOG_ADMIN_COOKIE}=${BLOG_ADMIN_COOKIE_VALUE}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${BLOG_ADMIN_MAX_AGE_SECONDS}${secure}`
}

export function buildBlogAdminLogoutCookieHeader(): string {
  const secure = shouldUseSecureBlogAdminCookie() ? '; Secure' : ''
  return `${BLOG_ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
}
