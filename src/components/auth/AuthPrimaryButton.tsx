import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
  trailing?: React.ReactNode
}

export function AuthPrimaryButton({
  className,
  loading,
  trailing,
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_14px_30px_-18px_rgba(0,31,63,0.5)] transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-18px_rgba(0,31,63,0.55)]',
        'active:translate-y-0',
        'disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <>
          <span>{children}</span>
          {trailing}
        </>
      )}
    </button>
  )
}
