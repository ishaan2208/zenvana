import * as React from 'react'
import clsx from 'clsx'

function Card({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={clsx(
        'flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm',
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={clsx('p-4', className)} {...props} />
}

export { Card, CardContent }
