'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const MAX_TAGS = 10
const MAX_TAG_CHARS = 32
const MIN_TAG_CHARS = 2

type Props = {
  /** Current tags, already normalized. */
  value: string[]
  /** Called with the new tag list whenever it changes. Always passes a normalized array. */
  onChange: (next: string[]) => void
  /** Pool of suggestions (typically aggregated from other posts' tags). */
  suggestions?: string[]
  /** Max number of tags allowed; defaults to 10 (Google rich-result sweet spot). */
  maxTags?: number
  /** Inline placeholder. */
  placeholder?: string
}

/**
 * Tags input — chip-style. Stores into `BlogPost.seoKeywords` on save.
 *
 * Keyboard:
 *   Enter   → commit current buffer
 *   ,       → commit current buffer
 *   Tab     → commit current buffer (if non-empty) or focus next field
 *   Backspace on empty buffer → remove the last chip
 *   Esc     → close suggestions dropdown
 *
 * Normalization (applied to every committed tag):
 *   - trim whitespace
 *   - lowercase
 *   - collapse internal whitespace to single space
 *   - reject if shorter than 2 chars or longer than 32 chars
 *   - dedupe against existing tags
 *
 * Suggestions are typeahead-filtered as the user types. Pressing ↓ moves
 * focus into the dropdown; Enter commits the highlighted suggestion.
 */
export function BlogTagInput({
  value,
  onChange,
  suggestions = [],
  maxTags = MAX_TAGS,
  placeholder = 'Add a tag and press Enter',
}: Props) {
  const [buffer, setBuffer] = useState('')
  const [open, setOpen] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const normalizedValue = useMemo(() => normalizeTags(value), [value])
  const reachedCap = normalizedValue.length >= maxTags

  // Filter suggestions: contains the buffer, not already used, dedupe.
  const filteredSuggestions = useMemo(() => {
    const used = new Set(normalizedValue)
    const needle = buffer.trim().toLowerCase()
    const pool = suggestions
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length >= MIN_TAG_CHARS && !used.has(s))
    const deduped = Array.from(new Set(pool))
    if (!needle) return deduped.slice(0, 8)
    return deduped.filter((s) => s.includes(needle)).slice(0, 8)
  }, [suggestions, normalizedValue, buffer])

  // Reset highlighted suggestion when the filter set changes.
  useEffect(() => {
    setActiveSuggestion(0)
  }, [filteredSuggestions.length])

  // Click-outside closes the dropdown.
  useEffect(() => {
    if (!open) return
    function handler(event: MouseEvent) {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  function commitTag(raw: string) {
    const normalized = normalizeOne(raw)
    if (!normalized) return false
    if (normalized.length < MIN_TAG_CHARS || normalized.length > MAX_TAG_CHARS) return false
    if (normalizedValue.includes(normalized)) return false
    if (reachedCap) return false
    onChange([...normalizedValue, normalized])
    setBuffer('')
    return true
  }

  function removeAt(index: number) {
    const next = normalizedValue.slice()
    next.splice(index, 1)
    onChange(next)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      // If a suggestion is highlighted and the dropdown is open, commit that.
      if (open && filteredSuggestions[activeSuggestion]) {
        event.preventDefault()
        commitTag(filteredSuggestions[activeSuggestion])
        return
      }
      if (buffer.trim()) {
        event.preventDefault()
        commitTag(buffer)
      }
    } else if (event.key === 'Tab' && buffer.trim()) {
      // Commit on tab without preventing focus move — slick.
      commitTag(buffer)
    } else if (event.key === 'Backspace' && !buffer && normalizedValue.length > 0) {
      removeAt(normalizedValue.length - 1)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveSuggestion((i) =>
        filteredSuggestions.length === 0 ? 0 : Math.min(i + 1, filteredSuggestions.length - 1),
      )
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveSuggestion((i) => Math.max(0, i - 1))
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData('text')
    if (text.includes(',') || text.includes('\n')) {
      event.preventDefault()
      const parts = text
        .split(/[,\n]/)
        .map((p) => p.trim())
        .filter(Boolean)
      const merged = Array.from(
        new Set([...normalizedValue, ...parts.map(normalizeOne).filter(Boolean) as string[]]),
      )
        .filter((s) => s.length >= MIN_TAG_CHARS && s.length <= MAX_TAG_CHARS)
        .slice(0, maxTags)
      onChange(merged)
      setBuffer('')
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-background px-2.5 py-2 text-sm focus-within:border-foreground/40"
        onClick={() => inputRef.current?.focus()}
      >
        {normalizedValue.map((tag, idx) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[12px] font-medium text-foreground"
          >
            #{tag}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                removeAt(idx)
              }}
              className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label={`Remove tag ${tag}`}
            >
              <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={buffer}
          onChange={(event) => {
            setBuffer(event.target.value)
            if (!open) setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setOpen(true)}
          placeholder={normalizedValue.length === 0 ? placeholder : ''}
          disabled={reachedCap}
          maxLength={MAX_TAG_CHARS + 4}
          className="min-w-[140px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          aria-label="Add a tag"
          aria-autocomplete="list"
        />
      </div>

      <div className="mt-1.5 flex items-baseline justify-between text-[11px] text-muted-foreground">
        <span>
          {normalizedValue.length}/{maxTags} tags · 2–{MAX_TAG_CHARS} chars · lowercase, hyphens ok
        </span>
        {reachedCap ? <span className="text-amber-700">Limit reached — remove one to add another.</span> : null}
      </div>

      {/* Suggestions dropdown */}
      {open && filteredSuggestions.length > 0 ? (
        <div
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-[0_18px_50px_-20px_rgba(8,17,31,0.4)]"
          role="listbox"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            From other posts
          </div>
          {filteredSuggestions.map((suggestion, idx) => (
            <button
              key={suggestion}
              type="button"
              role="option"
              aria-selected={activeSuggestion === idx}
              onMouseDown={(event) => {
                // Use onMouseDown so the input doesn't lose focus before we commit.
                event.preventDefault()
                commitTag(suggestion)
              }}
              onMouseEnter={() => setActiveSuggestion(idx)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
                activeSuggestion === idx ? 'bg-foreground text-background' : 'hover:bg-muted'
              }`}
            >
              <span>#{suggestion}</span>
              <span
                className={`text-[10px] uppercase tracking-[0.18em] ${
                  activeSuggestion === idx ? 'text-background/70' : 'text-muted-foreground/70'
                }`}
              >
                Enter
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* ─── Normalization helpers ──────────────────────────────────────── */

function normalizeOne(raw: string): string | null {
  const stripped = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, '') // strip emoji / punctuation
    .replace(/\s+/g, ' ')
    .trim()
  if (!stripped) return null
  return stripped
}

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of tags) {
    const norm = normalizeOne(raw)
    if (!norm) continue
    if (norm.length < MIN_TAG_CHARS || norm.length > MAX_TAG_CHARS) continue
    if (seen.has(norm)) continue
    seen.add(norm)
    out.push(norm)
  }
  return out
}
