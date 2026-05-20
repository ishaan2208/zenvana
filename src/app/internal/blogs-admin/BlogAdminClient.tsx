'use client'

import { BlogMediaType, BlogPostStatus, type BlogMedia, type BlogPost } from '@prisma/client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'

import {
  BlogImageUploadSlot,
  type UploadSlotMedia,
} from '@/app/internal/blogs-admin/BlogImageUploadSlot'
import { BlogRichTextEditor } from '@/app/internal/blogs-admin/BlogRichTextEditor'
import {
  deleteBlogPostAction,
  loginBlogAdmin,
  logoutBlogAdmin,
  registerUploadedMediaAction,
  removeBlogMediaAction,
  saveBlogPostAction,
  setHeroFromMediaAction,
  updateMediaAltTextAction,
} from '@/app/internal/blogs-admin/actions'
import {
  BLOG_IMAGE_SLOT_ROLES,
  type BlogImageRole,
} from '@/lib/blogImageSpecs'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { scoreBlogSeo, type SeoCheck } from '@/lib/blogSeoScore'

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

function slugifyTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function statusBadgeClass(status: BlogPostStatus) {
  return status === BlogPostStatus.PUBLISHED
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
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
  const [postFilter, setPostFilter] = useState('')
  const [postsSheetOpen, setPostsSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'media'>('content')
  const [dragging, setDragging] = useState(false)
  const [savedSnapshot, setSavedSnapshot] = useState<string>('')
  const slugTouchedRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedPost = useMemo(
    () => initialPosts.find((post) => post.id === form.id) ?? null,
    [initialPosts, form.id],
  )

  const filteredPosts = useMemo(() => {
    const q = postFilter.trim().toLowerCase()
    if (!q) return initialPosts
    return initialPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(q) ||
        post.slug.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q),
    )
  }, [initialPosts, postFilter])

  const seoReport = useMemo(
    () =>
      scoreBlogSeo({
        slug: form.slug,
        title: form.title,
        excerpt: form.excerpt,
        contentHtml: form.contentHtml,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        seoKeywords: form.seoKeywords,
        heroImageUrl: form.heroImageUrl,
        ogImageUrl: form.ogImageUrl,
        canonicalUrl: form.canonicalUrl,
        isIndexable: form.isIndexable,
        media: (selectedPost?.media ?? [])
          .filter((item) => item.type === BlogMediaType.IMAGE)
          .map((item) => ({ role: item.role, altText: item.altText })),
      }),
    [form, selectedPost],
  )

  const currentSnapshot = useMemo(() => JSON.stringify(form), [form])
  const isDirty = savedSnapshot !== currentSnapshot && form !== emptyForm

  function resetMessages() {
    setMessage(null)
    setError(null)
  }

  function loadPost(post: BlogPostWithMedia) {
    const next: BlogFormState = {
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
    }
    setForm(next)
    setSavedSnapshot(JSON.stringify(next))
    slugTouchedRef.current = Boolean(post.slug)
    setPostsSheetOpen(false)
    setActiveTab('content')
    resetMessages()
  }

  function startNewPost() {
    setForm(emptyForm)
    setSavedSnapshot(JSON.stringify(emptyForm))
    slugTouchedRef.current = false
    setPostsSheetOpen(false)
    setActiveTab('content')
    resetMessages()
  }

  // Auto-derive a clean slug from the title until the user types in the slug field directly.
  useEffect(() => {
    if (!form.id && !slugTouchedRef.current && form.title) {
      setForm((current) => ({ ...current, slug: slugifyTitle(current.title) }))
    }
  }, [form.title, form.id])

  // Warn on unsaved navigation away.
  useEffect(() => {
    if (!isDirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // ⌘/Ctrl+S to save, ⌘/Ctrl+K to open the posts browser.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      const key = event.key.toLowerCase()
      if (key === 's') {
        event.preventDefault()
        const formEl = document.getElementById('blog-admin-form') as HTMLFormElement | null
        formEl?.requestSubmit()
      } else if (key === 'k') {
        event.preventDefault()
        setPostsSheetOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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
        setForm((current) => {
          const next = { ...current, id: result.id! }
          setSavedSnapshot(JSON.stringify(next))
          return next
        })
      } else {
        setSavedSnapshot(JSON.stringify(form))
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

  async function handleUpload(
    file: File,
    options: {
      role?: BlogImageRole | 'GALLERY'
      width?: number
      height?: number
      altText?: string
    } = {},
  ): Promise<{ ok: boolean; error?: string; url?: string; mediaId?: string }> {
    if (!form.id) {
      const message = 'Save the post first before uploading media.'
      setError(message)
      return { ok: false, error: message }
    }
    if (file.size > 30 * 1024 * 1024) {
      const message = 'Files must be 30MB or smaller.'
      setError(message)
      return { ok: false, error: message }
    }

    resetMessages()
    const body = new FormData()
    body.set('file', file)
    body.set('role', options.role ?? 'GALLERY')
    if (options.width) body.set('width', String(options.width))
    if (options.height) body.set('height', String(options.height))

    const uploadResponse = await fetch('/api/internal/blog-media/upload', {
      method: 'POST',
      body,
    })

    if (!uploadResponse.ok) {
      const payload = await uploadResponse.json().catch(() => ({}))
      const message = payload.error ?? 'Upload failed'
      setError(message)
      return { ok: false, error: message }
    }

    const uploaded = await uploadResponse.json()
    const registerResult = await registerUploadedMediaAction({
      blogPostId: form.id,
      type: uploaded.type === BlogMediaType.VIDEO ? 'VIDEO' : 'IMAGE',
      role: uploaded.role ?? options.role ?? 'GALLERY',
      url: uploaded.url,
      publicId: uploaded.publicId,
      width: uploaded.width ?? undefined,
      height: uploaded.height ?? undefined,
      duration: uploaded.duration ?? undefined,
      bytes: uploaded.bytes ?? undefined,
      format: uploaded.format ?? undefined,
      altText: options.altText ?? file.name.replace(/\.[a-z0-9]+$/i, ''),
    })

    if (!registerResult.ok) {
      setError(registerResult.error ?? 'Failed to register media')
      return { ok: false, error: registerResult.error ?? 'Failed to register media' }
    }

    const role = uploaded.role ?? options.role ?? 'GALLERY'
    if (role === 'HERO_DESKTOP') {
      setForm((current) => ({ ...current, heroImageUrl: uploaded.url }))
    }

    setMessage(role === 'HERO_DESKTOP' ? 'Hero image uploaded' : 'Media uploaded')
    router.refresh()
    return { ok: true, url: uploaded.url, mediaId: registerResult.mediaId }
  }

  async function handleAltText(mediaId: string, altText: string): Promise<void> {
    resetMessages()
    const result = await updateMediaAltTextAction(mediaId, altText)
    if (!result.ok) {
      setError(result.error ?? 'Failed to update alt text')
      return
    }
    setMessage('Alt text saved')
    router.refresh()
  }

  async function handleRemoveMedia(mediaId: string) {
    if (!window.confirm('Remove this media file?')) return
    resetMessages()
    const removed = selectedPost?.media.find((item) => item.id === mediaId)
    const result = await removeBlogMediaAction(mediaId)
    if (!result.ok) {
      setError(result.error ?? 'Failed to remove media')
      return
    }
    if (
      removed?.role === 'HERO_DESKTOP' ||
      (removed?.url && form.heroImageUrl === removed.url)
    ) {
      setForm((current) => ({ ...current, heroImageUrl: '' }))
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
      <div className="mx-auto max-w-md rounded-[1.5rem] border border-border bg-card p-8 shadow-[0_18px_60px_-25px_rgba(8,17,31,0.45)]">
        <div className="eyebrow">Internal Tools</div>
        <h1 className="mt-2 font-serif text-3xl tracking-[-0.025em]">Blog Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter your password to manage blog posts.</p>
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="sr-only">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm"
              autoComplete="current-password"
              autoFocus
            />
          </label>
          {loginError ? <p className="text-sm text-red-600">{loginError}</p> : null}
          <button type="submit" className="site-button-dark w-full" disabled={isPending}>
            Unlock
          </button>
        </form>
      </div>
    )
  }

  const previewHref = form.slug ? `/blog/${form.slug}` : null
  const publishedCount = initialPosts.filter((p) => p.status === BlogPostStatus.PUBLISHED).length
  const draftCount = initialPosts.length - publishedCount

  return (
    <div className="space-y-6 pb-32 lg:pb-12">
      {/* Top bar */}
      <header className="rounded-[1.5rem] border border-border bg-card/80 p-4 shadow-[0_8px_30px_rgba(0,31,63,0.06)] backdrop-blur sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="eyebrow">Internal · Blog</div>
            <h1 className="mt-1 font-serif text-2xl tracking-[-0.025em] sm:text-3xl">Journal Admin</h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {initialPosts.length} total · {publishedCount} live · {draftCount} draft
              {isDirty ? <span className="ml-2 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">Unsaved</span> : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Sheet open={postsSheetOpen} onOpenChange={setPostsSheetOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="site-button-light"
                  aria-label="Search and open posts"
                >
                  <svg viewBox="0 0 16 16" className="mr-2 h-3.5 w-3.5" aria-hidden="true">
                    <path
                      d="M7 3a4 4 0 1 0 2.5 7.1l3.2 3.2a1 1 0 0 0 1.4-1.4l-3.2-3.2A4 4 0 0 0 7 3Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
                      fill="currentColor"
                    />
                  </svg>
                  Browse posts
                  <span className="ml-2 hidden rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] sm:inline">
                    {initialPosts.length}
                  </span>
                  <kbd className="ml-2 hidden rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
                    ⌘K
                  </kbd>
                </button>
              </SheetTrigger>
              <PostsSheet
                posts={filteredPosts}
                totalCount={initialPosts.length}
                filter={postFilter}
                onFilterChange={setPostFilter}
                activeId={form.id}
                onSelect={loadPost}
                onNew={startNewPost}
              />
            </Sheet>
            <button type="button" onClick={startNewPost} className="site-button-light">
              + New post
            </button>
            {previewHref ? (
              <a
                href={previewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="site-button-light"
                aria-label="Open preview in new tab"
              >
                Preview
                <svg viewBox="0 0 16 16" className="ml-2 h-3.5 w-3.5" aria-hidden="true">
                  <path
                    d="M6 3h7v7M13 3 7 9M3 5v8h8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            ) : null}
            <button type="button" onClick={handleLogout} className="site-button-light">
              Logout
            </button>
          </div>
        </div>

        {message || error ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {message ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-700 dark:text-emerald-400">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                  <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {message}
              </div>
            ) : null}
            {error ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-red-700 dark:text-red-400">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                  <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="min-w-0 space-y-6">
        {/* Tab nav */}
        <div className="sticky top-0 z-10 -mx-1 flex overflow-x-auto rounded-full border border-border bg-card/90 p-1 shadow-[0_8px_30px_rgba(0,31,63,0.06)] backdrop-blur sm:mx-0">
          {([
            { id: 'content', label: 'Content' },
            { id: 'seo', label: 'SEO' },
            { id: 'media', label: form.id ? `Media (${selectedPost?.media?.length ?? 0})` : 'Media' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-foreground text-background'
                  : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          id="blog-admin-form"
          onSubmit={handleSave}
          className="space-y-6 rounded-[1.5rem] border border-border bg-card/80 p-5 shadow-[0_8px_30px_rgba(0,31,63,0.06)] backdrop-blur sm:p-7"
        >
          {activeTab === 'content' ? (
            <ContentTab
              form={form}
              setForm={setForm}
              heroDesktopMedia={
                (selectedPost?.media.find(
                  (item) => item.role === 'HERO_DESKTOP' && item.type === BlogMediaType.IMAGE,
                ) as UploadSlotMedia | undefined) ?? null
              }
              onHeroUpload={(input) =>
                handleUpload(input.file, {
                  role: 'HERO_DESKTOP',
                  width: input.width,
                  height: input.height,
                  altText: input.altText,
                })
              }
              onHeroRemove={handleRemoveMedia}
              onHeroAltTextChange={handleAltText}
              isPending={isPending}
              onSlugTouched={() => {
                slugTouchedRef.current = true
              }}
            />
          ) : null}

          {activeTab === 'seo' ? (
            <SeoTab form={form} setForm={setForm} seoChecks={seoReport.checks} score={seoReport.score} />
          ) : null}

          {activeTab === 'media' ? (
            <MediaTab
              form={form}
              selectedPost={selectedPost}
              dragging={dragging}
              setDragging={setDragging}
              onUpload={handleUpload}
              onRemove={handleRemoveMedia}
              onSetHero={handleSetHero}
              onAltTextChange={handleAltText}
              fileInputRef={fileInputRef}
              isPending={isPending}
            />
          ) : null}
        </form>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl">
        <div
          className="container-shell flex flex-col items-stretch gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}
        >
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium uppercase tracking-[0.18em] ${statusBadgeClass(
                form.status,
              )}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" /> {form.status}
            </span>
            <SeoScoreChip score={seoReport.score} />
            {form.id ? (
              <span className="hidden text-[11px] sm:inline">
                /{form.slug || '…'}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={form.status === BlogPostStatus.PUBLISHED}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.checked ? BlogPostStatus.PUBLISHED : BlogPostStatus.DRAFT,
                  }))
                }
                className="h-4 w-4 rounded border-border"
              />
              Published
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={form.isIndexable}
                onChange={(event) => setForm((current) => ({ ...current, isIndexable: event.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              Indexable
            </label>
            {form.id ? (
              <button type="button" onClick={handleDelete} className="site-button-light text-red-700 hover:bg-red-50" disabled={isPending}>
                Delete
              </button>
            ) : null}
            <button
              type="submit"
              form="blog-admin-form"
              className="site-button-dark min-w-[140px] justify-center"
              disabled={isPending}
            >
              {isPending ? 'Saving…' : isDirty ? 'Save changes' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/* SUB-COMPONENTS                                          */
/* ─────────────────────────────────────────────────────── */

function ContentTab({
  form,
  setForm,
  heroDesktopMedia,
  onHeroUpload,
  onHeroRemove,
  onHeroAltTextChange,
  isPending,
  onSlugTouched,
}: {
  form: BlogFormState
  setForm: React.Dispatch<React.SetStateAction<BlogFormState>>
  heroDesktopMedia: UploadSlotMedia | null
  onHeroUpload: (input: {
    role: BlogImageRole
    file: File
    width: number
    height: number
    altText: string
  }) => Promise<{ ok: boolean; error?: string }>
  onHeroRemove: (mediaId: string) => Promise<void>
  onHeroAltTextChange: (mediaId: string, altText: string) => Promise<void>
  isPending: boolean
  onSlugTouched: () => void
}) {
  const slugLocked = form.status === BlogPostStatus.PUBLISHED

  return (
    <div className="space-y-6">
      <Field label="Title" hint="The headline readers see. 30–65 characters is ideal.">
        <input
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="A weekend on Rajpur Road"
          className="h-12 w-full rounded-xl border border-border bg-background px-4 text-lg font-serif tracking-[-0.015em]"
          required
        />
        <CharCount value={form.title} ideal={[30, 65]} max={80} />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Slug"
          hint={
            slugLocked
              ? 'Locked while published. Set to Draft to change (creates an auto 301).'
              : 'Lowercase, hyphens only. /blog/<slug>'
          }
        >
          <div className="flex items-center gap-2">
            <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">/blog/</span>
            <input
              value={form.slug}
              onChange={(event) => {
                onSlugTouched()
                setForm((current) => ({ ...current, slug: event.target.value }))
              }}
              readOnly={slugLocked}
              placeholder="weekend-on-rajpur-road"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm read-only:cursor-not-allowed read-only:opacity-70"
              required
            />
          </div>
        </Field>
        <Field
          label="Author"
          hint="Shown in the byline and Article schema."
        >
          <input
            value={form.authorName}
            onChange={(event) => setForm((current) => ({ ...current, authorName: event.target.value }))}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </Field>
      </div>

      <Field label="Excerpt" hint="120–160 chars works best for SERP snippets and social cards.">
        <textarea
          value={form.excerpt}
          onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
          className="min-h-[88px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6"
          required
        />
        <CharCount value={form.excerpt} ideal={[120, 160]} max={220} />
      </Field>

      <Field label="Article" hint="Use H2/H3 to structure. Drag to reorder content blocks.">
        <BlogRichTextEditor
          key={form.id || 'new-post'}
          editorKey={form.id || 'new-post'}
          value={form.contentHtml}
          onChange={(contentHtml) => setForm((current) => ({ ...current, contentHtml }))}
        />
      </Field>

      <Field
        label="Hero image"
        hint="16:9 desktop hero shown at the top of the article. Upload here — also used as the OG fallback when no dedicated OG image is set."
      >
        {form.id ? (
          <BlogImageUploadSlot
            role="HERO_DESKTOP"
            current={heroDesktopMedia}
            onUpload={onHeroUpload}
            onRemove={onHeroRemove}
            onAltTextChange={onHeroAltTextChange}
            busy={isPending}
          />
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Save the post first, then upload a hero image here.
          </div>
        )}
      </Field>

      <Field label="Alternate href" hint="Optional. Forces a different public URL (e.g. /best-hotel-in-dehradun).">
        <input
          value={form.alternateHref}
          onChange={(event) => setForm((current) => ({ ...current, alternateHref: event.target.value }))}
          placeholder="/best-hotel-in-dehradun"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
      </Field>
    </div>
  )
}

function SeoTab({
  form,
  setForm,
  seoChecks,
  score,
}: {
  form: BlogFormState
  setForm: React.Dispatch<React.SetStateAction<BlogFormState>>
  seoChecks: SeoCheck[]
  score: number
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zenvanahotels.com'
  const previewUrl = `${siteUrl}/blog/${form.slug || 'your-slug'}`
  const seoTitle = (form.seoTitle || form.title || 'Title preview').slice(0, 60)
  const seoDescription = (form.seoDescription || form.excerpt || 'Meta description preview…').slice(0, 165)

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-[1.25rem] border border-border bg-background p-5">
          <ScoreDial score={score} />
          <div className="mt-3 text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            SEO Health
          </div>
        </div>
        <div className="rounded-[1.25rem] border border-border bg-background p-5">
          <div className="eyebrow">Checklist</div>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {seoChecks.map((check) => (
              <li key={check.id} className="flex items-start gap-2 text-sm">
                <SeverityDot severity={check.severity} />
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{check.label}</div>
                  <div className="text-xs text-muted-foreground">{check.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* SERP preview */}
      <div className="rounded-[1.25rem] border border-border bg-background p-5">
        <div className="eyebrow">SERP preview</div>
        <div className="mt-3 max-w-[600px]">
          <div className="text-xs text-emerald-700 dark:text-emerald-400">{previewUrl}</div>
          <div className="mt-0.5 line-clamp-2 text-[20px] leading-tight text-[#1a0dab] hover:underline dark:text-blue-400">
            {seoTitle}
          </div>
          <p className="mt-1 line-clamp-3 text-sm leading-snug text-muted-foreground">{seoDescription}</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="SEO title" hint="Used in the browser tab + SERP. Falls back to title.">
          <input
            value={form.seoTitle}
            onChange={(event) => setForm((current) => ({ ...current, seoTitle: event.target.value }))}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            maxLength={70}
          />
          <CharCount value={form.seoTitle} ideal={[40, 60]} max={70} />
        </Field>
        <Field label="Canonical URL" hint="Absolute path or full URL. Defaults to /blog/<slug>.">
          <input
            value={form.canonicalUrl}
            onChange={(event) => setForm((current) => ({ ...current, canonicalUrl: event.target.value }))}
            placeholder="/blog/your-slug"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </Field>
      </div>

      <Field label="Meta description" hint="120–160 characters works best for SERPs.">
        <textarea
          value={form.seoDescription}
          onChange={(event) => setForm((current) => ({ ...current, seoDescription: event.target.value }))}
          className="min-h-[88px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6"
          maxLength={200}
        />
        <CharCount value={form.seoDescription} ideal={[120, 160]} max={200} />
      </Field>

      <Field label="SEO keywords" hint="3–5 phrases, comma-separated.">
        <input
          value={form.seoKeywords}
          onChange={(event) => setForm((current) => ({ ...current, seoKeywords: event.target.value }))}
          placeholder="best hotel in dehradun, rajpur road stay, family hotels"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
        {form.seoKeywords.trim() ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {form.seoKeywords
              .split(',')
              .map((keyword) => keyword.trim())
              .filter(Boolean)
              .map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-foreground/80"
                >
                  {keyword}
                </span>
              ))}
          </div>
        ) : null}
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="OG title" hint="Optional title for social shares.">
          <input
            value={form.ogTitle}
            onChange={(event) => setForm((current) => ({ ...current, ogTitle: event.target.value }))}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </Field>
        <Field label="OG description" hint="Optional description for social shares.">
          <input
            value={form.ogDescription}
            onChange={(event) => setForm((current) => ({ ...current, ogDescription: event.target.value }))}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </Field>
      </div>

      <Field label="OG image URL" hint="1200×630 PNG/JPG works best. Falls back to hero image.">
        <input
          value={form.ogImageUrl}
          onChange={(event) => setForm((current) => ({ ...current, ogImageUrl: event.target.value }))}
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
        {form.ogImageUrl || form.heroImageUrl ? (
          <div className="relative mt-3 aspect-[1200/630] max-w-md overflow-hidden rounded-xl border border-border">
            <Image
              src={form.ogImageUrl || form.heroImageUrl}
              alt="OG preview"
              fill
              className="object-cover"
              unoptimized={(form.ogImageUrl || form.heroImageUrl).startsWith('http')}
            />
          </div>
        ) : null}
      </Field>
    </div>
  )
}

function MediaTab({
  form,
  selectedPost,
  dragging,
  setDragging,
  onUpload,
  onRemove,
  onSetHero,
  onAltTextChange,
  fileInputRef,
  isPending,
}: {
  form: BlogFormState
  selectedPost: BlogPostWithMedia | null
  dragging: boolean
  setDragging: (value: boolean) => void
  onUpload: (
    file: File,
    options?: { role?: BlogImageRole | 'GALLERY'; width?: number; height?: number; altText?: string },
  ) => Promise<{ ok: boolean; error?: string }>
  onRemove: (mediaId: string) => Promise<void>
  onSetHero: (mediaId: string) => Promise<void>
  onAltTextChange: (mediaId: string, altText: string) => Promise<void>
  fileInputRef: React.RefObject<HTMLInputElement>
  isPending: boolean
}) {
  if (!form.id) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-border p-10 text-center">
        <h3 className="font-serif text-lg">Save the post first</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          You need to create the post (Save) before uploading images. Each image role enforces strict
          dimensions, aspect ratios, and file sizes so the public site stays SEO-clean.
        </p>
      </div>
    )
  }

  const allMedia = selectedPost?.media ?? []
  const galleryMedia = allMedia.filter(
    (item) => item.role === 'GALLERY' && item.type === BlogMediaType.IMAGE,
  )
  const videoMedia = allMedia.filter((item) => item.type === BlogMediaType.VIDEO)

  // Wrap onUpload into the slot's expected shape.
  const slotUpload = async (input: {
    role: BlogImageRole
    file: File
    width: number
    height: number
    altText: string
  }) =>
    onUpload(input.file, {
      role: input.role,
      width: input.width,
      height: input.height,
      altText: input.altText,
    })

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl tracking-[-0.02em]">Image roles</h3>
            <p className="text-sm text-muted-foreground">
              Each role has its own strict spec — uploads are validated for size, aspect ratio, and
              dimensions before they reach Cloudinary. The public site automatically chooses the right
              variant for desktop, mobile, social cards, and listing thumbnails.
            </p>
          </div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {allMedia.length} file{allMedia.length === 1 ? '' : 's'}
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-2">
          {BLOG_IMAGE_SLOT_ROLES.map((role) => {
            const current = allMedia.find(
              (item) => item.role === role && item.type === BlogMediaType.IMAGE,
            ) as UploadSlotMedia | undefined
            return (
              <BlogImageUploadSlot
                key={role}
                role={role}
                current={current ?? null}
                onUpload={slotUpload}
                onRemove={onRemove}
                onAltTextChange={onAltTextChange}
                busy={isPending}
              />
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl tracking-[-0.02em]">Gallery & extras</h3>
            <p className="text-sm text-muted-foreground">
              Additional images for the gallery grid after the article body, plus any videos.
              Looser spec — minimum 800×600, max 3 MB, alt text still required for SEO.
            </p>
          </div>
        </header>

        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            const file = event.dataTransfer.files?.[0]
            if (file) void onUpload(file, { role: 'GALLERY' })
          }}
          className={`relative flex flex-col items-center justify-center rounded-[1.25rem] border-2 border-dashed p-8 text-center transition ${
            dragging ? 'border-foreground bg-foreground/5' : 'border-border'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-muted-foreground" aria-hidden="true">
            <path
              d="M12 16V8m0 0-3 3m3-3 3 3M5 18h14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h4 className="mt-3 font-serif text-lg">Drop gallery images or a video</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            JPG, PNG, WebP, AVIF, or MP4. Max 30MB.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="site-button-dark mt-4"
          >
            Choose a file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void onUpload(file, { role: 'GALLERY' })
              event.currentTarget.value = ''
            }}
          />
        </div>

        {galleryMedia.length + videoMedia.length === 0 ? (
          <p className="text-sm text-muted-foreground">No gallery items uploaded yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...galleryMedia, ...videoMedia].map((item) => {
              const isHero = form.heroImageUrl === item.url
              return (
                <li key={item.id} className="overflow-hidden rounded-xl border border-border bg-background">
                  <div className="relative aspect-[4/3] bg-muted">
                    {item.type === BlogMediaType.IMAGE ? (
                      <Image
                        src={item.url}
                        alt={item.altText || 'Blog media'}
                        fill
                        className="object-cover"
                        unoptimized={item.url.startsWith('http')}
                      />
                    ) : (
                      <video src={item.url} className="h-full w-full object-cover" muted playsInline />
                    )}
                    {isHero ? (
                      <div className="absolute left-2 top-2 rounded-full bg-foreground/85 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-background">
                        Hero
                      </div>
                    ) : null}
                  </div>
                  <div className="p-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <span>{item.role.replace('_', ' ').toLowerCase()}</span>
                      {item.width && item.height ? (
                        <>
                          <span>·</span>
                          <span>
                            {item.width}×{item.height}
                          </span>
                        </>
                      ) : null}
                      {item.bytes ? (
                        <>
                          <span>·</span>
                          <span>{(item.bytes / 1024 / 1024).toFixed(1)} MB</span>
                        </>
                      ) : null}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-foreground/80">
                      {item.altText || 'No alt text (add one for SEO)'}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.type === BlogMediaType.IMAGE && !isHero ? (
                        <button
                          type="button"
                          className="site-button-light text-xs"
                          onClick={() => void onSetHero(item.id)}
                        >
                          Set as hero
                        </button>
                      ) : null}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="site-button-light text-xs"
                      >
                        Open
                      </a>
                      <button
                        type="button"
                        onClick={() => void onRemove(item.id)}
                        className="site-button-light text-xs text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.22em] text-foreground/80">{label}</span>
      </div>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
    </label>
  )
}

function CharCount({ value, ideal, max }: { value: string; ideal: [number, number]; max: number }) {
  const length = value.length
  const [low, high] = ideal
  let color = 'text-muted-foreground'
  if (length === 0) color = 'text-muted-foreground'
  else if (length < low) color = 'text-amber-600 dark:text-amber-400'
  else if (length > high) color = length > max ? 'text-red-600' : 'text-amber-600 dark:text-amber-400'
  else color = 'text-emerald-700 dark:text-emerald-400'

  return (
    <div className="mt-1 flex items-center justify-between text-[11px]">
      <span className={`${color}`}>
        {length} / {max} — ideal {low}–{high}
      </span>
      <div className="ml-3 h-1 max-w-[120px] flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${
            length === 0
              ? 'bg-muted'
              : length < low
              ? 'bg-amber-500'
              : length > high
              ? length > max
                ? 'bg-red-500'
                : 'bg-amber-500'
              : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(100, (length / max) * 100)}%` }}
        />
      </div>
    </div>
  )
}

function SeverityDot({ severity }: { severity: SeoCheck['severity'] }) {
  const color =
    severity === 'good'
      ? 'bg-emerald-500'
      : severity === 'warn'
      ? 'bg-amber-500'
      : 'bg-red-500'
  return <span className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${color}`} aria-hidden="true" />
}

function SeoScoreChip({ score }: { score: number }) {
  const tone =
    score >= 80
      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
      : score >= 60
      ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-400'
      : 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400'
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
      SEO {score}/100
    </span>
  )
}

function ScoreDial({ score }: { score: number }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const dash = (score / 100) * circumference
  const tone = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-2xl tracking-[-0.025em]">{score}</span>
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">/100</span>
      </div>
    </div>
  )
}


/**
 * Shadcn Sheet that holds the searchable posts browser.
 * Opened from the top bar or via ⌘/Ctrl+K — slides in from the left on
 * every breakpoint so it stays consistent across mobile and desktop.
 */
function PostsSheet({
  posts,
  totalCount,
  filter,
  onFilterChange,
  activeId,
  onSelect,
  onNew,
}: {
  posts: BlogPostWithMedia[]
  totalCount: number
  filter: string
  onFilterChange: (value: string) => void
  activeId: string
  onSelect: (post: BlogPostWithMedia) => void
  onNew: () => void
}) {
  const publishedCount = posts.filter((post) => post.status === BlogPostStatus.PUBLISHED).length
  const draftCount = posts.length - publishedCount

  return (
    <SheetContent side="left" className="flex w-full flex-col p-0 sm:max-w-md">
      <SheetHeader className="border-b border-border px-5 pb-4 pt-6">
        <SheetTitle>Browse posts</SheetTitle>
        <SheetDescription>
          Search, filter, and open any draft or published story.{' '}
          <span className="hidden sm:inline">Press </span>
          <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>{' '}
          anytime.
        </SheetDescription>
      </SheetHeader>

      <div className="border-b border-border bg-card/40 px-5 py-4">
        <label className="relative block">
          <span className="sr-only">Search posts</span>
          <svg
            viewBox="0 0 20 20"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          >
            <path
              d="M9 3a6 6 0 1 0 3.74 10.66l3.3 3.3a1 1 0 0 0 1.42-1.42l-3.3-3.3A6 6 0 0 0 9 3Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
              fill="currentColor"
            />
          </svg>
          <input
            autoFocus
            type="search"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder="Search by title, slug, or author"
            className="h-11 w-full rounded-full border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-foreground/40"
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              {posts.length}
              {filter ? <span className="ml-1 normal-case tracking-normal opacity-70">/ {totalCount}</span> : null}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {publishedCount} live
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {draftCount} draft
            </span>
          </div>
          <SheetClose asChild>
            <button
              type="button"
              onClick={onNew}
              className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium normal-case tracking-normal text-foreground transition hover:bg-card"
            >
              + New post
            </button>
          </SheetClose>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1.5">
          {posts.map((post) => (
            <li key={post.id}>
              <SheetClose asChild>
                <button
                  type="button"
                  onClick={() => onSelect(post)}
                  className={`group block w-full rounded-xl px-3 py-3 text-left transition ${
                    activeId === post.id
                      ? 'bg-foreground text-background'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-sm font-medium leading-snug">
                        {post.title || 'Untitled'}
                      </div>
                      <div
                        className={`mt-1 truncate text-[11px] ${
                          activeId === post.id ? 'opacity-80' : 'text-muted-foreground'
                        }`}
                      >
                        /{post.slug}
                      </div>
                      <div
                        className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] ${
                          activeId === post.id ? 'opacity-80' : 'text-muted-foreground'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              post.status === BlogPostStatus.PUBLISHED
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                            }`}
                            aria-hidden="true"
                          />
                          {post.status === BlogPostStatus.PUBLISHED ? 'Live' : 'Draft'}
                        </span>
                        <span>·</span>
                        <span>{post.authorName}</span>
                        <span>·</span>
                        <time dateTime={post.updatedAt.toISOString()}>
                          {new Intl.DateTimeFormat('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          }).format(post.updatedAt)}
                        </time>
                      </div>
                    </div>
                    {post.heroImageUrl ? (
                      <div className="relative hidden h-12 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted sm:block">
                        <Image
                          src={post.heroImageUrl}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized={post.heroImageUrl.startsWith('http')}
                        />
                      </div>
                    ) : null}
                  </div>
                </button>
              </SheetClose>
            </li>
          ))}
          {posts.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              {filter ? `No posts match “${filter}”.` : 'No posts yet — start by creating one.'}
            </li>
          ) : null}
        </ul>
      </div>
    </SheetContent>
  )
}
