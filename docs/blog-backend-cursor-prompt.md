# Backend Cursor Prompt — Blog Comments + Newsletter

Paste this verbatim into Cursor in the backend repo (`/Users/ishaanbajaj/Desktop/staysystems/backend`).
The frontend is already wired against the contracts below; do not change paths or response shapes.

---

You are working in the `staysystems/backend` repo (Express + Prisma + Zod + SMTP nodemailer). The frontend Next.js site is shipping a new editorial blog and needs two backend modules: **blog comments** and **blog newsletter subscription**. Both authenticate via the existing `ZenvanaGuestAccount` session cookie (`zenvanaGuestSession`). No new auth system.

## Constraints
- Mount new routes under `/api/v1/public/zenvana-guest/blog/*`.
- Use the existing response envelope: `{ ok: true, data }` or `{ ok: false, error, message?, details? }`.
- Validate request bodies and query strings with **zod** (`.safeParse`).
- Wrap controllers with the existing `asyncHandler`.
- Protect authenticated endpoints with the existing `requireZenvanaGuestSession` middleware from `src/modules/zenvana-guest-auth/zenvanaGuestAuth.middleware.js`.
- Use the existing `sendMail()` helper from `ts/lib/sendMail.ts` for any outgoing email.
- All comment bodies must be sanitized server-side (use `isomorphic-dompurify` — `pnpm add isomorphic-dompurify`) before storing the rendered HTML. Store both `body` (raw markdown) and `bodyHtml` (sanitized).
- Add a single migration file. Don't squash existing migrations.
- Do NOT add an `isAdmin` field; the comment/newsletter system here is guest-facing only. Moderation tooling is out of scope.

---

## 1. Prisma models

Add to `prisma/schema.prisma`:

```prisma
model BlogComment {
  id           Int      @id @default(autoincrement())
  postSlug     String   // matches the slug used in the Next.js blog
  parentId     Int?
  parent       BlogComment?  @relation("BlogCommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies      BlogComment[] @relation("BlogCommentReplies")

  body         String   @db.Text
  bodyHtml     String   @db.Text

  accountId    Int
  account      ZenvanaGuestAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  isDeleted    Boolean  @default(false)
  deletedAt    DateTime?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([postSlug, createdAt])
  @@index([accountId])
  @@index([parentId])
}

model BlogNewsletterSubscription {
  id            Int      @id @default(autoincrement())
  accountId     Int      @unique
  account       ZenvanaGuestAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  email         String
  subscribed    Boolean  @default(true)
  subscribedAt  DateTime @default(now())
  unsubscribedAt DateTime?
  source        String   @default("blog")          // freeform tag: blog, footer, etc.
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([subscribed, subscribedAt])
}
```

Add the reverse relations to `ZenvanaGuestAccount`:

```prisma
model ZenvanaGuestAccount {
  // ... existing fields ...
  blogComments               BlogComment[]
  blogNewsletterSubscription BlogNewsletterSubscription?
}
```

Run: `pnpm prisma migrate dev --name blog_comments_and_newsletter`

---

## 2. New module: `src/modules/zenvana-blog/`

Create:
```
src/modules/zenvana-blog/
  zenvanaBlog.service.ts      // pure DB/logic (testable, no req/res)
  zenvanaBlog.controller.ts   // thin wrappers, asyncHandler + zod + envelope
  zenvanaBlog.email.ts        // welcome email template
```

### Service contract (pure functions)

```ts
// zenvanaBlog.service.ts
type CommentDto = {
  id: number
  postSlug: string
  parentId: number | null
  body: string
  bodyHtml: string
  author: { id: number; displayName: string; initials: string }
  isOwn: boolean
  createdAt: string
  updatedAt: string
  editableUntil: string | null     // createdAt + 15 min, or null if not editable
  replies?: CommentDto[]           // present only on top-level comments
}

export async function listCommentsForPost(input: {
  postSlug: string
  viewerAccountId: number | null
  sort: 'newest' | 'oldest'
  cursor?: string                  // base64 of "<createdAtISO>|<id>"
  limit?: number                   // default 50
}): Promise<{ comments: CommentDto[]; total: number; nextCursor: string | null }>

export async function createComment(input: {
  accountId: number
  postSlug: string
  parentId: number | null
  body: string                     // raw markdown
}): Promise<CommentDto>

export async function editComment(input: {
  commentId: number
  accountId: number                // must match comment.accountId
  body: string
}): Promise<CommentDto>

// Soft delete: sets isDeleted=true, deletedAt=now(), redacts body/bodyHtml on read.
export async function deleteComment(input: {
  commentId: number
  accountId: number
}): Promise<{ id: number }>
```

Rules:
- 15-minute edit/delete window enforced server-side: reject 403 if `Date.now() - createdAt.getTime() > 15 * 60 * 1000`.
- Replies are only ONE level deep. Reject 400 if `parentId` is itself a reply (i.e. `parent.parentId !== null`).
- Sanitization (controller-side): use the markdown→HTML pipeline below. Stored `body` is the raw markdown, `bodyHtml` is the sanitized result.
- `displayName` derivation: `firstName + ' ' + lastName` → fallback `displayName` → fallback `Guest #<id>`. Initials: first letter of each of up to two name parts uppercased.
- `isOwn` = `comment.accountId === viewerAccountId`.
- `replies` populated for top-level comments only; cap at 50 replies (UI doesn't paginate them).
- Soft-deleted comments: replace `body`/`bodyHtml` with `"[removed]"` but keep them in the tree so reply threading stays coherent.

### Markdown sanitization

Allow only: `**bold**`, `*italic*`, `[text](url)` (https-only), `> blockquote`, bare URLs auto-linked. **No HTML in input.** Use `marked` with `{ breaks: true, gfm: false }`, then DOMPurify with allowed tags `['a', 'strong', 'em', 'p', 'br', 'blockquote']` and allowed attrs `['href', 'rel', 'target']`. Force `rel="noopener noreferrer nofollow ugc"` and `target="_blank"` on all `<a>`.

### Newsletter service

```ts
type NewsletterStatus = {
  subscribed: boolean
  email: string | null
  subscribedAt: string | null
}

export async function getNewsletterStatus(accountId: number): Promise<NewsletterStatus>
export async function subscribeNewsletter(input: { accountId: number; email?: string }): Promise<NewsletterStatus>
export async function unsubscribeNewsletter(accountId: number): Promise<NewsletterStatus>
```

- Email resolution: use `email` param if provided + valid; else fall back to `ZenvanaGuestAccount.email`. If neither, return 422 `{ ok:false, error:"NO_EMAIL_ON_ACCOUNT" }`.
- On a fresh subscribe (or re-subscribe after unsubscribed=true), send the welcome email via `sendMail` (see template below). Don't send if the account was already subscribed.
- Updating `email` on resubscribe is allowed and should write the new email back to `BlogNewsletterSubscription.email` (do NOT mutate `ZenvanaGuestAccount.email`).

### Welcome email (`zenvanaBlog.email.ts`)

```ts
import { sendMail } from '../../../ts/lib/sendMail'

export async function sendNewsletterWelcomeEmail(opts: {
  to: string
  firstName?: string | null
}) {
  const greeting = opts.firstName ? `Dear ${opts.firstName},` : 'Dear traveller,'
  await sendMail({
    to: opts.to,
    subject: 'Welcome to the Zenvana Journal',
    html: `
      <div style="font-family: Georgia, 'Times New Roman', serif; color:#0A0E1A; line-height:1.7; max-width:560px; margin:0 auto; padding:40px 24px;">
        <div style="font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#8C6E2B; margin-bottom:32px;">The Zenvana Journal</div>
        <p style="font-size:18px; margin:0 0 16px;">${greeting}</p>
        <p style="margin:0 0 14px;">Thank you for joining the Journal. We send one note a month — new guides, seasonal openings on Rajpur Road, and the quiet places worth your time around Dehradun and Mussoorie.</p>
        <p style="margin:0 0 14px;">No promotions. No churn. Just considered notes from the team that runs our hotels.</p>
        <p style="margin:24px 0 0;">Until then,</p>
        <p style="margin:4px 0 0; font-style:italic;">The Zenvana Team</p>
        <hr style="border:0; border-top:1px solid #E8DFC9; margin:32px 0;" />
        <p style="font-size:11px; color:#7B7B7B; margin:0;">You can unsubscribe any time from the bottom of any post on <a href="https://www.zenvanahotels.com/blog" style="color:#1E488F;">zenvanahotels.com/blog</a>.</p>
      </div>
    `,
  })
}
```

---

## 3. HTTP endpoints (`src/routes/zenvanaGuestBlog.routes.ts`)

Mount in `src/routes/public.routes.ts`:

```ts
router.use('/zenvana-guest/blog', zenvanaGuestBlogRoutes)
```

### Routes

| Method | Path | Auth | Body / Query | Returns |
|---|---|---|---|---|
| GET | `/comments?postSlug=&sort=newest&cursor=` | optional (`optionalZenvanaGuestSession`) | `postSlug` required | `{ comments: CommentDto[], total, nextCursor }` |
| POST | `/comments` | **required** | `{ postSlug, body, parentId? }` | `CommentDto` |
| PATCH | `/comments/:id` | **required**, own + ≤15 min | `{ body }` | `CommentDto` |
| DELETE | `/comments/:id` | **required**, own + ≤15 min | — | `{ id }` |
| GET | `/newsletter/status` | **required** | — | `NewsletterStatus` |
| POST | `/newsletter/subscribe` | **required** | `{ email? }` | `NewsletterStatus` |
| POST | `/newsletter/unsubscribe` | **required** | — | `NewsletterStatus` |

### Validation schemas (zod)

```ts
const postSlugRe = /^[a-z0-9][a-z0-9-]{0,99}$/

const listCommentsQuery = z.object({
  postSlug: z.string().regex(postSlugRe),
  sort: z.enum(['newest', 'oldest']).default('newest'),
  cursor: z.string().optional(),
})

const createCommentBody = z.object({
  postSlug: z.string().regex(postSlugRe),
  body: z.string().min(2).max(2000),
  parentId: z.number().int().positive().nullable().optional(),
})

const editCommentBody = z.object({
  body: z.string().min(2).max(2000),
})

const subscribeBody = z.object({
  email: z.string().email().optional(),
})
```

### Error responses

- 400 `{ ok:false, error:"VALIDATION", details:<zod.flatten()> }` on bad payload
- 401 `{ ok:false, error:"UNAUTHORIZED" }` from existing middleware
- 403 `{ ok:false, error:"FORBIDDEN" }` for edit/delete after 15 min, or non-owner
- 404 `{ ok:false, error:"NOT_FOUND" }` for missing comment
- 422 `{ ok:false, error:"NO_EMAIL_ON_ACCOUNT" }` for newsletter when account lacks email
- 429 `{ ok:false, error:"RATE_LIMITED" }` — rate-limit comment POST to 5 per minute per account (existing `express-rate-limit` if present, else simple in-memory bucket keyed on accountId)

### Rate limits
- Comments POST: 5/min per account, 60/day per account.
- Newsletter subscribe/unsubscribe: 10/min per account.

---

## 4. Acceptance checklist

- [ ] `pnpm prisma migrate dev` runs clean
- [ ] `GET /api/v1/public/zenvana-guest/blog/comments?postSlug=test` returns `{ ok:true, data:{ comments:[], total:0, nextCursor:null } }` for an unknown slug, no auth required
- [ ] Posting `<script>alert(1)</script>` as a comment body is stored as the literal text and `bodyHtml` does not include a script tag
- [ ] Editing your own comment within 15 min succeeds; after 15 min returns 403
- [ ] Replying to a reply returns 400 `NESTED_REPLY` (or similar)
- [ ] `POST /newsletter/subscribe` triggers ONE outbound email via `sendMail`; resubscribing without unsubscribing does NOT trigger another
- [ ] All routes appear in the Express route list under `/api/v1/public/zenvana-guest/blog`
- [ ] No new env vars required (uses existing SMTP config + cookie session)

When you finish, output a one-line summary of the migration name and any tests added.
