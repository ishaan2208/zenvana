'use client'

import { BlogMediaRole, type BlogMedia } from '@prisma/client'
import Image from 'next/image'
import { useCallback, useMemo, useRef, useState } from 'react'

import {
  describeAllowedTypes,
  describeMaxSize,
  formatBytes,
  getBlogImageSpec,
  type BlogImageRole,
} from '@/lib/blogImageSpecs'
import {
  describeSpec,
  readImageDimensions,
  validateBlogImage,
  type ImageValidationIssue,
} from '@/lib/blogImageValidation'

export type UploadSlotMedia = Pick<
  BlogMedia,
  'id' | 'url' | 'width' | 'height' | 'bytes' | 'format' | 'altText'
>

type Props = {
  role: BlogImageRole
  /** The current uploaded media in this slot (if any). */
  current: UploadSlotMedia | null
  /** Persist a successful upload. Returns the new media id (or throws). */
  onUpload: (input: {
    role: BlogImageRole
    file: File
    width: number
    height: number
    altText: string
  }) => Promise<{ ok: boolean; error?: string }>
  /** Remove the current upload. */
  onRemove: (mediaId: string) => Promise<void>
  /** Update alt text on an existing media item. */
  onAltTextChange?: (mediaId: string, altText: string) => Promise<void>
  /** Whether the surrounding form is in a busy state. */
  busy?: boolean
}

/**
 * One upload "slot" tied to a specific BlogImageRole.
 * - Renders the spec inline so writers know what's expected.
 * - Validates the file BEFORE network upload (size, type, dimensions, aspect).
 * - Shows colour-coded inline feedback and a preview with detected dimensions.
 * - Collects alt text — required for accessibility + SEO ranking.
 */
export function BlogImageUploadSlot({
  role,
  current,
  onUpload,
  onRemove,
  onAltTextChange,
  busy,
}: Props) {
  const spec = useMemo(() => getBlogImageSpec(role), [role])
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<null | {
    file: File
    width: number
    height: number
    previewUrl: string
    issues: ImageValidationIssue[]
    ok: boolean
  }>(null)
  const [altText, setAltText] = useState(current?.altText ?? '')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [altSaving, setAltSaving] = useState(false)
  const [altSaved, setAltSaved] = useState(false)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      try {
        const dimensions = await readImageDimensions(file)
        const validation = validateBlogImage({
          role,
          file: { type: file.type, size: file.size, name: file.name },
          dimensions,
          // Skip alt-text check until upload step — we collect it after the preview.
          altText: 'placeholder',
        })
        const previewUrl = URL.createObjectURL(file)
        setPending({
          file,
          width: dimensions.width,
          height: dimensions.height,
          previewUrl,
          issues: validation.issues,
          ok: validation.ok,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not read image')
        setPending(null)
      }
    },
    [role],
  )

  function clearPending() {
    if (pending) URL.revokeObjectURL(pending.previewUrl)
    setPending(null)
    setError(null)
  }

  async function commitUpload() {
    if (!pending || !pending.ok) return
    if (!altText.trim() || altText.trim().length < 4) {
      setError('Add alt text describing what the image shows (min 4 chars).')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const result = await onUpload({
        role,
        file: pending.file,
        width: pending.width,
        height: pending.height,
        altText: altText.trim(),
      })
      if (!result.ok) {
        setError(result.error ?? 'Upload failed')
        return
      }
      clearPending()
    } finally {
      setUploading(false)
    }
  }

  async function saveAltText() {
    if (!current || !onAltTextChange) return
    setAltSaving(true)
    setAltSaved(false)
    try {
      await onAltTextChange(current.id, altText.trim())
      setAltSaved(true)
      setTimeout(() => setAltSaved(false), 1500)
    } finally {
      setAltSaving(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/80 shadow-[0_8px_30px_rgba(0,31,63,0.06)]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-card/60 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-serif text-base tracking-[-0.015em] text-foreground">{spec.label}</h4>
            <span className="inline-flex items-center rounded-full border border-border bg-background/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {role.replace('_', ' ').toLowerCase()}
            </span>
          </div>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">{spec.description}</p>
        </div>
        <SpecBadge spec={spec} />
      </header>

      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_280px]">
        {/* Visual surface */}
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
            if (file) void handleFile(file)
          }}
          className={`relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center transition ${
            dragging ? 'border-foreground bg-foreground/5' : 'border-border bg-background/60'
          }`}
          style={{ aspectRatio: pending ? `${pending.width} / ${pending.height}` : `${spec.aspectRatio}` }}
        >
          {pending ? (
            <Image
              src={pending.previewUrl}
              alt="Preview"
              fill
              sizes="(min-width: 1024px) 500px, 100vw"
              className="object-cover"
              unoptimized
            />
          ) : current ? (
            <Image
              src={current.url}
              alt={current.altText || spec.label}
              fill
              sizes="(min-width: 1024px) 500px, 100vw"
              className="object-cover"
              unoptimized={current.url.startsWith('http')}
            />
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center gap-2 px-6 text-sm text-muted-foreground transition hover:text-foreground"
              disabled={busy || uploading}
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
                <path
                  d="M12 16V8m0 0-3 3m3-3 3 3M5 18h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Drop an image here or click to choose</span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                {spec.aspectLabel} · {describeAllowedTypes(spec.allowedMimeTypes)}
              </span>
            </button>
          )}
          {(uploading || busy) && pending ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm text-sm">
              Uploading…
            </div>
          ) : null}
          {!pending && current ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/65 to-transparent p-3 text-[11px] text-white">
              <div className="flex flex-wrap items-center gap-1.5">
                {current.width && current.height ? (
                  <span className="rounded-full bg-white/15 px-2 py-0.5 backdrop-blur">
                    {current.width}×{current.height}
                  </span>
                ) : null}
                {current.bytes ? (
                  <span className="rounded-full bg-white/15 px-2 py-0.5 backdrop-blur">
                    {formatBytes(current.bytes)}
                  </span>
                ) : null}
                {current.format ? (
                  <span className="rounded-full bg-white/15 px-2 py-0.5 uppercase backdrop-blur">
                    {current.format}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          <input
            ref={inputRef}
            type="file"
            accept={spec.allowedMimeTypes.join(',')}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleFile(file)
              event.currentTarget.value = ''
            }}
          />

          {/* Validation panel (pending file) */}
          {pending ? (
            <div className="space-y-3 rounded-xl border border-border bg-background p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-foreground">Pre-upload check</div>
                <PassFailBadge ok={pending.ok} />
              </div>
              <ValidationList issues={pending.issues} />
              <div className="text-[11px] text-muted-foreground">
                Detected: {pending.width}×{pending.height} · {formatBytes(pending.file.size)} ·{' '}
                {pending.file.type || 'unknown'}
              </div>
            </div>
          ) : null}

          {/* Alt text */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium uppercase tracking-[0.22em] text-foreground/80">
              Alt text {spec.altTextRequired ? <span className="text-red-600">*</span> : null}
            </label>
            <textarea
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder={altPlaceholder(role)}
              className="min-h-[64px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-snug"
              maxLength={140}
            />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{altText.length}/140 chars — describe what’s pictured, not how it looks.</span>
              {current && onAltTextChange && altText.trim() !== (current.altText ?? '') ? (
                <button
                  type="button"
                  onClick={() => void saveAltText()}
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                  disabled={altSaving}
                >
                  {altSaving ? 'Saving…' : altSaved ? 'Saved ✓' : 'Save alt'}
                </button>
              ) : null}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {pending ? (
              <>
                <button
                  type="button"
                  onClick={() => void commitUpload()}
                  disabled={!pending.ok || uploading}
                  className="site-button-dark flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? 'Uploading…' : 'Confirm upload'}
                </button>
                <button type="button" onClick={clearPending} className="site-button-light">
                  Cancel
                </button>
              </>
            ) : current ? (
              <>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="site-button-light"
                  disabled={busy}
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => void onRemove(current.id)}
                  className="site-button-light text-red-700 hover:bg-red-50"
                  disabled={busy}
                >
                  Remove
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="site-button-dark"
                disabled={busy}
              >
                Upload {spec.shortLabel.toLowerCase()}
              </button>
            )}
          </div>

          {error ? (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-700">{error}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function SpecBadge({ spec }: { spec: ReturnType<typeof getBlogImageSpec> }) {
  return (
    <div className="shrink-0 rounded-lg border border-border bg-background px-3 py-2 text-right text-[10px] leading-tight">
      <div className="font-medium uppercase tracking-[0.18em] text-foreground/80">Spec</div>
      <div className="mt-0.5 text-muted-foreground">{describeSpec(spec)}</div>
      <div className="text-muted-foreground/80">
        min {spec.minimum.width}×{spec.minimum.height} · max {describeMaxSize(spec.maxBytes)}
      </div>
    </div>
  )
}

function PassFailBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-700">
      ✓ Ready
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-red-700">
      ✕ Needs fix
    </span>
  )
}

function ValidationList({ issues }: { issues: ImageValidationIssue[] }) {
  if (issues.length === 0) {
    return <div className="text-[11px] text-emerald-700">Looks good. Add alt text below and confirm.</div>
  }
  return (
    <ul className="space-y-1.5">
      {issues.map((issue, index) => (
        <li key={`${issue.code}-${index}`} className="flex items-start gap-2 text-[11px]">
          <span
            className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
              issue.severity === 'fail' ? 'bg-red-500' : 'bg-amber-500'
            }`}
            aria-hidden="true"
          />
          <span className="text-foreground/85">{issue.message}</span>
        </li>
      ))}
    </ul>
  )
}

function altPlaceholder(role: BlogImageRole): string {
  switch (role) {
    case 'HERO_DESKTOP':
    case 'HERO_MOBILE':
      return 'Late-evening light across the Rajpur Road façade, with guests arriving at the lobby.'
    case 'THUMBNAIL':
      return 'A close-up of the hand-pressed tile floor in a Silkwood guest suite.'
    case 'OG':
      return 'The Silkwood at golden hour, framed by deodar trees.'
    case 'INLINE':
      return 'A small wooden tray with house-blended chai and biscotti.'
    default:
      return 'Describe what the image shows in one short sentence.'
  }
}

export { BlogMediaRole }
