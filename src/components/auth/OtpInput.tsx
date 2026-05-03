'use client'

import clsx from 'clsx'
import { useEffect, useRef } from 'react'

type OtpInputProps = {
  value: string
  onChange: (val: string) => void
  length?: number
  disabled?: boolean
  autoFocus?: boolean
  hasError?: boolean
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  autoFocus,
  hasError,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  const setDigit = (idx: number, digit: string) => {
    const cleaned = digit.replace(/\D/g, '')
    if (cleaned.length > 1) {
      const next = (value.slice(0, idx) + cleaned).slice(0, length)
      onChange(next)
      const focusIdx = Math.min(idx + cleaned.length, length - 1)
      refs.current[focusIdx]?.focus()
      return
    }
    const chars = value.padEnd(length, ' ').split('')
    chars[idx] = cleaned[0] ?? ''
    const next = chars.join('').replace(/\s/g, '').slice(0, length)
    onChange(next)
    if (cleaned && idx < length - 1) refs.current[idx + 1]?.focus()
  }

  const handleKey = (idx: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      e.preventDefault()
      const chars = value.padEnd(length, ' ').split('')
      chars[idx - 1] = ''
      onChange(chars.join('').replace(/\s/g, ''))
      refs.current[idx - 1]?.focus()
      return
    }
    if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault()
      refs.current[idx - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && idx < length - 1) {
      e.preventDefault()
      refs.current[idx + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!text) return
    e.preventDefault()
    onChange(text)
    refs.current[Math.min(text.length, length - 1)]?.focus()
  }

  return (
    <div
      className="flex items-center justify-between gap-2 sm:gap-2.5"
      onPaste={handlePaste}
      role="group"
      aria-label="One-time passcode"
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={value[i] ?? ''}
          disabled={disabled}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={handleKey(i)}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={`Digit ${i + 1}`}
          className={clsx(
            'aspect-square w-full max-w-[3.25rem] rounded-2xl border bg-background text-center font-serif text-xl font-semibold text-foreground transition-all',
            'focus:outline-none focus:ring-2',
            hasError
              ? 'border-destructive/60 focus:border-destructive focus:ring-destructive/25'
              : 'border-border/70 focus:border-primary focus:ring-primary/25',
            value[i] &&
              !hasError &&
              'border-primary/50 bg-card shadow-[0_4px_14px_-6px_rgba(0,31,63,0.18)]',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        />
      ))}
    </div>
  )
}
