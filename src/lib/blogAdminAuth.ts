import { cookies } from 'next/headers'

export const BLOG_ADMIN_PASSWORD = 'admin123'
export const BLOG_ADMIN_COOKIE = 'zenvana_blog_admin'
const BLOG_ADMIN_COOKIE_VALUE = 'authorized'
const BLOG_ADMIN_MAX_AGE_SECONDS = 60 * 60 * 8

export function isBlogAdminAuthorized(cookieValue: string | undefined): boolean {
  return cookieValue === BLOG_ADMIN_COOKIE_VALUE
}

export async function getBlogAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  return isBlogAdminAuthorized(cookieStore.get(BLOG_ADMIN_COOKIE)?.value)
}

export function buildBlogAdminCookieHeader(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${BLOG_ADMIN_COOKIE}=${BLOG_ADMIN_COOKIE_VALUE}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${BLOG_ADMIN_MAX_AGE_SECONDS}${secure}`
}

export function buildBlogAdminLogoutCookieHeader(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${BLOG_ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`
}
