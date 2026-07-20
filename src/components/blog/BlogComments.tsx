'use client'

import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  deleteBlogComment,
  editBlogComment,
  listBlogComments,
  postBlogComment,
  type BlogCommentNode,
} from '@/lib/blogGuestApi'
import { useGuestSession } from '@/lib/useGuestSession'

import { BlogCommentsSkeleton } from './BlogSkeletons'

type Props = {
  postSlug: string
  /** Title of the post — shown in the sign-in prompt copy. */
  postTitle?: string
}

/**
 * Logged-out users can READ the conversation (more inviting); only the input
 * is gated. We hit the existing ZenvanaGuest session cookie via fetch
 * `credentials: 'include'`, so no extra auth wiring is needed.
 */
export function BlogComments({ postSlug, postTitle }: Props) {
  const { guest, signedIn, loading: sessionLoading } = useGuestSession()
  const [comments, setComments] = useState<BlogCommentNode[] | null>(null)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await listBlogComments(postSlug, { sort })
    if (!result.ok) {
      setError(result.error)
      setComments([])
      setLoading(false)
      return
    }
    setComments(result.data.comments)
    setTotal(result.data.total)
    setLoading(false)
  }, [postSlug, sort])

  useEffect(() => {
    void load()
  }, [load])

  const charCount = body.trim().length
  const canPost = signedIn && charCount >= 2 && charCount <= 2000 && !posting

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canPost) return
    setPosting(true)
    setError(null)
    const result = await postBlogComment({
      postSlug,
      body: body.trim(),
      parentId: replyingTo,
    })
    setPosting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setBody('')
    setReplyingTo(null)
    try {
      const { track } = await import('@/lib/analytics/client')
      track('blog_comment_submitted', {
        slug: postSlug,
        isReply: Boolean(replyingTo),
        bodyLength: body.trim().length,
      })
    } catch {
      /* ignore */
    }
    await load()
  }

  async function handleEdit(comment: BlogCommentNode, newBody: string) {
    const trimmed = newBody.trim()
    if (trimmed.length < 2) return
    const result = await editBlogComment(comment.id, trimmed)
    if (!result.ok) {
      setError(result.error)
      return
    }
    await load()
  }

  async function handleDelete(comment: BlogCommentNode) {
    if (!window.confirm('Delete this comment?')) return
    const result = await deleteBlogComment(comment.id)
    if (!result.ok) {
      setError(result.error)
      return
    }
    await load()
  }

  return (
    <section
      id="comments"
      aria-labelledby="comments-heading"
      className="mx-auto mt-16 max-w-[68ch] scroll-mt-24"
    >
      <header className="flex flex-wrap items-end justify-between gap-3 border-t border-border/60 pt-10">
        <div>
          <div className="eyebrow">Conversation</div>
          <h2 id="comments-heading" className="display-title mt-2 text-2xl sm:text-3xl">
            {total > 0 ? `${total} ${total === 1 ? 'reply' : 'replies'}` : 'Join the conversation'}
          </h2>
        </div>
        {comments && comments.length > 1 ? (
          <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background/80 p-1 text-xs">
            <SortButton active={sort === 'newest'} onClick={() => setSort('newest')}>Newest</SortButton>
            <SortButton active={sort === 'oldest'} onClick={() => setSort('oldest')}>Oldest</SortButton>
          </div>
        ) : null}
      </header>

      {/* Compose */}
      <div className="mt-6">
        {sessionLoading ? (
          <div className="h-32 animate-pulse rounded-2xl border border-border/60 bg-card/50" />
        ) : signedIn ? (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur">
            <div className="flex items-start gap-3">
              <GuestAvatar
                name={[guest?.firstName, guest?.lastName].filter(Boolean).join(' ') || guest?.displayName || 'Guest'}
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">
                  Posting as <span className="font-medium text-foreground">
                    {[guest?.firstName, guest?.lastName].filter(Boolean).join(' ') ||
                      guest?.displayName ||
                      `Guest #${guest?.id ?? ''}`}
                  </span>
                </div>
                {replyingTo ? (
                  <div className="mt-1 inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                    Replying to a comment ·{' '}
                    <button
                      type="button"
                      className="underline-offset-2 hover:underline"
                      onClick={() => setReplyingTo(null)}
                    >
                      cancel
                    </button>
                  </div>
                ) : null}
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value.slice(0, 2000))}
                  placeholder="Share a question, a tip, or a memory from your stay."
                  className="mt-2 min-h-[96px] w-full resize-y rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-foreground/40"
                  maxLength={2000}
                />
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{charCount}/2000 · Markdown supported (links, **bold**, *italic*)</span>
                </div>
              </div>
            </div>
            {error ? <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-700">{error}</div> : null}
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={!canPost}
                className="site-button-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {posting ? 'Posting…' : replyingTo ? 'Post reply' : 'Post comment'}
              </button>
            </div>
          </form>
        ) : (
          <SignInPrompt postSlug={postSlug} postTitle={postTitle} />
        )}
      </div>

      {/* List */}
      <div className="mt-10">
        {loading || comments === null ? (
          <BlogCommentsSkeleton />
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            No comments yet. {signedIn ? 'Be the first to share what you thought.' : 'Sign in to be the first.'}
          </div>
        ) : (
          <ul className="space-y-6">
            {comments.map((comment) => (
              <li key={comment.id}>
                <CommentNode
                  comment={comment}
                  signedIn={signedIn}
                  onReply={() => {
                    setReplyingTo(comment.id)
                    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────── */

function CommentNode({
  comment,
  signedIn,
  onReply,
  onEdit,
  onDelete,
  depth = 0,
}: {
  comment: BlogCommentNode
  signedIn: boolean
  onReply: () => void
  onEdit: (comment: BlogCommentNode, newBody: string) => Promise<void> | void
  onDelete: (comment: BlogCommentNode) => Promise<void> | void
  depth?: number
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.body)
  const editableUntil = useMemo(
    () => (comment.editableUntil ? new Date(comment.editableUntil) : null),
    [comment.editableUntil],
  )
  const canEdit =
    comment.isOwn && editableUntil !== null && editableUntil.getTime() > Date.now()

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-3 border-l border-border/40 pl-4 sm:ml-6' : ''}`}>
      <GuestAvatar name={comment.author.displayName} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
          <span className="font-medium text-foreground">{comment.author.displayName}</span>
          <time
            dateTime={comment.createdAt}
            className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
            title={new Date(comment.createdAt).toLocaleString()}
          >
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </time>
          {comment.updatedAt !== comment.createdAt ? (
            <span className="text-[11px] italic text-muted-foreground">edited</span>
          ) : null}
        </div>

        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, 2000))}
              className="min-h-[88px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm leading-6"
              maxLength={2000}
              autoFocus
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setDraft(comment.body)
                }}
                className="site-button-light"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onEdit(comment, draft)
                  setEditing(false)
                }}
                className="site-button-dark"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            className="mt-1.5 text-sm leading-7 text-foreground/90 [overflow-wrap:anywhere] [&_a]:underline [&_a]:underline-offset-2"
            dangerouslySetInnerHTML={{ __html: comment.bodyHtml }}
          />
        )}

        {!editing ? (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {depth === 0 && signedIn ? (
              <button type="button" onClick={onReply} className="transition hover:text-foreground">
                Reply
              </button>
            ) : null}
            {canEdit ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="transition hover:text-foreground"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void onDelete(comment)}
                  className="text-red-600/80 transition hover:text-red-600"
                >
                  Delete
                </button>
                <span className="normal-case tracking-normal text-muted-foreground/70">
                  · editable for{' '}
                  {editableUntil ? formatDistanceToNow(editableUntil, { addSuffix: false }) : '15 min'}
                </span>
              </>
            ) : null}
          </div>
        ) : null}

        {comment.replies && comment.replies.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <li key={reply.id}>
                <CommentNode
                  comment={reply}
                  signedIn={signedIn}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  depth={depth + 1}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}

function SignInPrompt({ postSlug, postTitle }: { postSlug: string; postTitle?: string }) {
  // Login lives at /login on the marketing site; pass redirect so the user
  // returns to the comments section after authentication.
  const redirect = encodeURIComponent(`/blog/${postSlug}#comments`)
  const loginHref = `/login?redirect=${redirect}`
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-6 text-center backdrop-blur">
      <div className="eyebrow">Sign in to join in</div>
      <h3 className="mt-2 font-serif text-lg tracking-[-0.015em] text-foreground sm:text-xl">
        We keep the conversation kind by asking commenters to sign in.
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Use the same number you book with — it takes a moment and lets us send you a quiet reply if anyone
        answers you.{postTitle ? ` You’ll return right to “${postTitle}”.` : ''}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Link href={loginHref} className="site-button-dark">
          Sign in
        </Link>
        <Link href={`/register?redirect=${redirect}`} className="site-button-light">
          Create an account
        </Link>
      </div>
    </div>
  )
}

function GuestAvatar({ name }: { name: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'Z'
  return (
    <span
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold text-foreground ring-1 ring-border/70"
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

function SortButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 transition ${
        active ? 'bg-foreground text-background' : 'text-foreground/70 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
