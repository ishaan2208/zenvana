/**
 * Client for the *public-facing* blog endpoints on the Zenvana backend
 * (comments + newsletter). Auth piggy-backs on the ZenvanaGuest session
 * cookie that's already issued by the main login flow.
 *
 * Endpoint contract (must match `src/routes/zenvanaGuestBlog.routes.ts` on backend):
 *
 *   GET    /api/v1/public/zenvana-guest/blog/comments?postSlug=…[&cursor=…]
 *   POST   /api/v1/public/zenvana-guest/blog/comments           (auth)
 *   PATCH  /api/v1/public/zenvana-guest/blog/comments/:id       (auth, own + ≤15 min)
 *   DELETE /api/v1/public/zenvana-guest/blog/comments/:id       (auth, own + ≤15 min)
 *
 *   GET    /api/v1/public/zenvana-guest/blog/newsletter/status  (auth)
 *   POST   /api/v1/public/zenvana-guest/blog/newsletter/subscribe   (auth)
 *   POST   /api/v1/public/zenvana-guest/blog/newsletter/unsubscribe (auth)
 *
 * Response envelope (matches the rest of the backend):
 *   { ok: true, data: ... } | { ok: false, error: string, message?: string }
 */

function blogApiBase(): string {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
  const trimmed = base.replace(/\/$/, '')
  const withApi = trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`
  return `${withApi}/public/zenvana-guest/blog`
}

export type BlogCommentAuthor = {
  id: number
  displayName: string
  initials: string
}

export type BlogCommentNode = {
  id: number
  postSlug: string
  parentId: number | null
  body: string
  bodyHtml: string
  author: BlogCommentAuthor
  isOwn: boolean
  createdAt: string
  updatedAt: string
  editableUntil: string | null
  /** Direct replies (one level deep; deeper replies live in flatlist). */
  replies?: BlogCommentNode[]
}

export type BlogCommentsResponse = {
  comments: BlogCommentNode[]
  total: number
  nextCursor: string | null
}

export type NewsletterStatus = {
  subscribed: boolean
  email: string | null
  subscribedAt: string | null
}

async function fetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${blogApiBase()}${path}`, {
      credentials: 'include',
      ...init,
      headers: {
        ...(init?.body && !(init.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(init?.headers ?? {}),
      },
    })
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      data?: T
      error?: string
      message?: string
    }
    if (!res.ok || json.ok === false) {
      return {
        ok: false,
        error: json.error || json.message || `Request failed (${res.status})`,
      }
    }
    return { ok: true, data: json.data as T }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

export function listBlogComments(
  postSlug: string,
  options: { cursor?: string; sort?: 'newest' | 'oldest' } = {},
) {
  const params = new URLSearchParams({ postSlug })
  if (options.cursor) params.set('cursor', options.cursor)
  if (options.sort) params.set('sort', options.sort)
  return fetchJson<BlogCommentsResponse>(`/comments?${params.toString()}`, { method: 'GET' })
}

export function postBlogComment(input: {
  postSlug: string
  body: string
  parentId?: number | null
}) {
  return fetchJson<BlogCommentNode>('/comments', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function editBlogComment(commentId: number, body: string) {
  return fetchJson<BlogCommentNode>(`/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  })
}

export function deleteBlogComment(commentId: number) {
  return fetchJson<{ id: number }>(`/comments/${commentId}`, { method: 'DELETE' })
}

export function getNewsletterStatus() {
  return fetchJson<NewsletterStatus>('/newsletter/status', { method: 'GET' })
}

export function subscribeNewsletter(email?: string) {
  return fetchJson<NewsletterStatus>('/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify(email ? { email } : {}),
  })
}

export function unsubscribeNewsletter() {
  return fetchJson<NewsletterStatus>('/newsletter/unsubscribe', { method: 'POST' })
}
