import Image from 'next/image'
import clsx from 'clsx'

export function Logo({
  className,
  showText = true,
  ...props
}: React.ComponentPropsWithoutRef<'div'> & { showText?: boolean }) {
  return (
    <div
      className={clsx('flex items-center gap-2', className)}
      {...props}
    >
      <Image
        src="/zenvana-logo.svg"
        alt=""
        width={120}
        height={48}
        className="h-10 w-auto object-contain sm:h-12"
        priority
      />
      {showText && (
        <span className="font-display text-lg font-semibold text-primary sm:text-xl">
          Zenvana
        </span>
      )}
    </div>
  )
}
