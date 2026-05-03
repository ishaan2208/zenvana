import clsx from 'clsx'
import { useId, forwardRef } from 'react'

type BrandFieldProps = Omit<React.ComponentPropsWithoutRef<'input'>, 'id'> & {
  label: string
  error?: string
  hint?: string
  leading?: React.ReactNode
  trailing?: React.ReactNode
}

export const BrandField = forwardRef<HTMLInputElement, BrandFieldProps>(function BrandField(
  { label, error, hint, leading, trailing, className, ...props },
  ref,
) {
  const id = useId()
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
      >
        {label}
      </label>
      <div
        className={clsx(
          'group flex items-center gap-2 rounded-2xl border bg-background/85 px-4 transition-all',
          error
            ? 'border-destructive/60 focus-within:border-destructive focus-within:ring-2 focus-within:ring-destructive/15'
            : 'border-border/70 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15',
        )}
      >
        {leading && (
          <span className="shrink-0 text-sm font-medium text-muted-foreground">{leading}</span>
        )}
        <input
          id={id}
          ref={ref}
          {...props}
          className="h-12 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
        />
        {trailing && <span className="shrink-0 text-muted-foreground">{trailing}</span>}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground/80">{hint}</p>
      ) : null}
    </div>
  )
})
