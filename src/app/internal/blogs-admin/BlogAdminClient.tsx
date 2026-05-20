'use client'

import { BlogMediaType, BlogPostStatus, type BlogMedia, type BlogPost } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'

import { BlogRichTextEditor } from '@/app/internal/blogs-admin/BlogRichTextEditor'
import {
  deleteBlogPostAction,
  loginBlogAdmin,
  logoutBlogAdmin,
  registerUploadedMediaAction,
  removeBlogMediaAction,
  saveBlogPostAction,
  setHeroFromMediaAction,
} from '@/app/internal/blogs-admin/actions'

type BlogPostWithMedia = BlogPost & { media: BlogMedia[] }

type BlogAdminClientProps = {
  authorized: boolean
  posts: BlogPostWithMedia[]
}

type BlogFormState = {
  id: string
  slug: string
  title: string
  excerpt: string
  contentHtml: string
  alternateHref: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  canonicalUrl: string
  ogTitle: string
  ogDescription: string
  ogImageUrl: string
  heroImageUrl: string
  authorName: string
  status: BlogPostStatus
  isIndexable: boolean
}

const emptyForm: BlogFormState = {
  id: '',
  slug: '',
  title: '',
  excerpt: '',
  contentHtml: '',
  alternateHref: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  canonicalUrl: '',
  ogTitle: '',
  ogDescription: '',
  ogImageUrl: '',
  heroImageUrl: '',
  authorName: 'Zenvana Hotels',
  status: BlogPostStatus.DRAFT,
  isIndexable: false,
}

export function BlogAdminClient({ authorized: initialAuthorized, posts: initialPosts }: BlogAdminClientProps) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(initialAuthorized)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedPost = useMemo(
    () => initialPosts.find((post) => post.id === form.id) ?? null,
    [initialPosts, form.id],
  )

  function resetMessages() {
    setMessage(null)
    setError(null)
  }

  function loadPost(post: BlogPostWithMedia) {
    setForm({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      contentHtml: post.contentHtml,
      alternateHref: post.alternateHref ?? '',
      seoTitle: post.seoTitle ?? '',
      seoDescription: post.seoDescription ?? '',
      seoKeywords: post.seoKeywords.join(', '),
      canonicalUrl: post.canonicalUrl ?? '',
      ogTitle: post.ogTitle ?? '',
      ogDescription: post.ogDescription ?? '',
      ogImageUrl: post.ogImageUrl ?? '',
      heroImageUrl: post.heroImageUrl ?? '',
      authorName: post.authorName,
      status: post.status,
      isIndexable: post.isIndexable,
    })
    resetMessages()
  }

  function startNewPost() {
    setForm(emptyForm)
    resetMessages()
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    resetMessages()
    const result = await loginBlogAdmin(password)
    if (!result.ok) {
      setLoginError(result.error ?? 'Login failed')
      return
    }
    setAuthorized(true)
    setLoginError(null)
    router.refresh()
  }

  async function handleLogout() {
    await logoutBlogAdmin()
    setAuthorized(false)
    setPassword('')
    router.refresh()
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    resetMessages()

    const content = form.contentHtml.replace(/<p><\/p>/g, '').trim()
    if (!content || content === '<p></p>') {
      setError('Article content is required')
      return
    }

    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'isIndexable') return
      formData.set(key, String(value))
    })
    if (form.isIndexable) {
      formData.set('isIndexable', 'on')
    }
    formData.set('status', form.status)

    startTransition(async () => {
      const result = await saveBlogPostAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'Failed to save')
        return
      }
      setMessage('Post saved')
      if (result.id) {
        setForm((current) => ({ ...current, id: result.id! }))
      }
      router.refresh()
    })
  }

  async function handleDelete() {
    if (!form.id) return
    if (!window.confirm('Delete this blog post permanently?')) return
    resetMessages()

    startTransition(async () => {
      const result = await deleteBlogPostAction(form.id)
      if (!result.ok) {
        setError(result.error ?? 'Failed to delete')
        return
      }
      setMessage('Post deleted')
      startNewPost()
      router.refresh()
    })
  }

  async function handleUpload(file: File) {
    if (!form.id) {
      setError('Save the post first before uploading media')
      return
    }

    resetMessages()
    const body = new FormData()
    body.set('file', file)

    const uploadResponse = await fetch('/api/internal/blog-media/upload', {
      method: 'POST',
      body,
    })

    if (!uploadResponse.ok) {
      const payload = await uploadResponse.json().catch(() => ({}))
      setError(payload.error ?? 'Upload failed')
      return
    }

    const uploaded = await uploadResponse.json()
    const registerResult = await registerUploadedMediaAction({
      blogPostId: form.id,
      type: uploaded.type === BlogMediaType.VIDEO ? 'VIDEO' : 'IMAGE',
      url: uploaded.url,
      publicId: uploaded.publicId,
      width: uploaded.width ?? undefined,
      height: uploaded.height ?? undefined,
      duration: uploaded.duration ?? undefined,
      altText: file.name,
    })

    if (!registerResult.ok) {
      setError(registerResult.error ?? 'Failed to register media')
      return
    }

    setMessage('Media uploaded')
    router.refresh()
  }

  async function handleRemoveMedia(mediaId: string) {
    resetMessages()
    const result = await removeBlogMediaAction(mediaId)
    if (!result.ok) {
      setError(result.error ?? 'Failed to remove media')
      return
    }
    setMessage('Media removed')
    router.refresh()
  }

  async function handleSetHero(mediaId: string) {
    if (!form.id) return
    resetMessages()
    const result = await setHeroFromMediaAction(form.id, mediaId)
    if (!result.ok) {
      setError(result.error ?? 'Failed to set hero')
      return
    }
    setMessage('Hero image updated')
    router.refresh()
  }

  if (!authorized) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Blog Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter password to manage blog posts.</p>
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            autoComplete="current-password"
          />
          {loginError ? <p className="text-sm text-red-600">{loginError}</p> : null}
          <button type="submit" className="site-button-dark w-full" disabled={isPending}>
            Unlock
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Blog Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, publish, and upload media for SEO blog posts.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={startNewPost} className="site-button-light">
            New Post
          </button>
          <button type="button" onClick={handleLogout} className="site-button-light">
            Logout
          </button>
        </div>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Posts</h2>
          <ul className="max-h-[70vh] space-y-2 overflow-y-auto">
            {initialPosts.map((post) => (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() => loadPost(post)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    form.id === post.id ? 'bg-foreground text-background' : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">{post.title}</div>
                  <div className="text-xs opacity-70">
                    {post.status} · /{post.slug}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>Slug</span>
              <input
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                readOnly={form.status === BlogPostStatus.PUBLISHED}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 read-only:cursor-not-allowed read-only:opacity-70"
                required
              />
              {form.status === BlogPostStatus.PUBLISHED ? (
                <span className="text-xs text-muted-foreground">
                  Slug is locked while published. Set to Draft to change (a 301 redirect is created automatically).
                </span>
              ) : null}
            </label>
            <label className="space-y-1 text-sm">
              <span>Alternate href (optional)</span>
              <input
                value={form.alternateHref}
                onChange={(event) => setForm((current) => ({ ...current, alternateHref: event.target.value }))}
                placeholder="/best-hotel-in-dehradun"
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
          </div>

          <label className="block space-y-1 text-sm">
            <span>Title</span>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              required
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span>Author</span>
            <input
              value={form.authorName}
              onChange={(event) => setForm((current) => ({ ...current, authorName: event.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span>Excerpt</span>
            <textarea
              value={form.excerpt}
              onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
              className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2"
              required
            />
          </label>

          <div className="space-y-2 text-sm">
            <span className="font-medium">Article content</span>
            <BlogRichTextEditor
              key={form.id || 'new-post'}
              editorKey={form.id || 'new-post'}
              value={form.contentHtml}
              onChange={(contentHtml) => setForm((current) => ({ ...current, contentHtml }))}
            />
            <p className="text-xs text-muted-foreground">
              Formatted like a word processor. Saved as HTML for SEO-friendly server rendering.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>SEO title</span>
              <input
                value={form.seoTitle}
                onChange={(event) => setForm((current) => ({ ...current, seoTitle: event.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Canonical URL</span>
              <input
                value={form.canonicalUrl}
                onChange={(event) => setForm((current) => ({ ...current, canonicalUrl: event.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
          </div>

          <label className="block space-y-1 text-sm">
            <span>SEO description</span>
            <textarea
              value={form.seoDescription}
              onChange={(event) => setForm((current) => ({ ...current, seoDescription: event.target.value }))}
              className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span>SEO keywords (comma separated)</span>
            <input
              value={form.seoKeywords}
              onChange={(event) => setForm((current) => ({ ...current, seoKeywords: event.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>OG title</span>
              <input
                value={form.ogTitle}
                onChange={(event) => setForm((current) => ({ ...current, ogTitle: event.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>OG description</span>
              <input
                value={form.ogDescription}
                onChange={(event) => setForm((current) => ({ ...current, ogDescription: event.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>OG image URL</span>
              <input
                value={form.ogImageUrl}
                onChange={(event) => setForm((current) => ({ ...current, ogImageUrl: event.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Hero image URL</span>
              <input
                value={form.heroImageUrl}
                onChange={(event) => setForm((current) => ({ ...current, heroImageUrl: event.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="space-y-1 text-sm">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as BlogPostStatus,
                  }))
                }
                className="block rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value={BlogPostStatus.DRAFT}>Draft</option>
                <option value={BlogPostStatus.PUBLISHED}>Published</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isIndexable}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isIndexable: event.target.checked }))
                }
              />
              Allow search indexing
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="site-button-dark" disabled={isPending}>
              Save Post
            </button>
            {form.id ? (
              <button type="button" onClick={handleDelete} className="site-button-light" disabled={isPending}>
                Delete Post
              </button>
            ) : null}
          </div>

          {form.id ? (
            <section className="space-y-4 border-t border-border pt-6">
              <h3 className="text-lg font-semibold">Media</h3>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void handleUpload(file)
                  event.currentTarget.value = ''
                }}
              />
              <ul className="space-y-3">
                {(selectedPost?.media ?? []).map((media) => (
                  <li key={media.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                    <a href={media.url} target="_blank" rel="noreferrer" className="site-link break-all text-sm">
                      {media.type}: {media.url}
                    </a>
                    {media.type === BlogMediaType.IMAGE ? (
                      <button
                        type="button"
                        className="site-button-light"
                        onClick={() => void handleSetHero(media.id)}
                      >
                        Set as hero
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="site-button-light"
                      onClick={() => void handleRemoveMedia(media.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </form>
      </div>
    </div>
  )
}
