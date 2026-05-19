import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-md bg-muted/60',
        'animate-pulse before:absolute before:inset-0 before:-translate-x-full before:bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.4)_45%,transparent_100%)] before:animate-[pulse_2s_ease-in-out_infinite]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
