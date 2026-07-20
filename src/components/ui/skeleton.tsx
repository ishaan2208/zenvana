import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative isolate overflow-hidden rounded-md bg-muted/60',
        'animate-pulse before:absolute before:inset-0 before:bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.38)_45%,transparent_100%)] before:animate-pulse',
        'motion-reduce:animate-none motion-reduce:before:hidden',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
