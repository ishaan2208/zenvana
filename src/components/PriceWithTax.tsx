'use client'

import { splitTotalIntoBaseAndTax, formatPrice } from '@/lib/price'
import { cn } from '@/lib/utils'

type PriceWithTaxProps = {
  /** Total amount (inclusive of tax) as number */
  amount: number
  /** Currency symbol, default ₹ */
  currency?: string
  /** Optional suffix e.g. " per room", " /night" */
  suffix?: string
  /** Size: sm, default, lg, xl, 2xl */
  size?: 'sm' | 'default' | 'lg' | 'xl' | '2xl'
  /** Extra class for the wrapper */
  className?: string
  /** If true, render inline (no wrapper div) */
  inline?: boolean
  /** If false, show only total amount without base + tax breakup. Default true */
  showTaxBreakup?: boolean
}

/**
 * Displays a rate with tax breakup: "₹762 + ₹38" with tax shown subtly beside the base.
 * Use everywhere a rate/total is shown so the site has a uniform presentation.
 */
export function PriceWithTax({
  amount,
  currency = '₹',
  suffix = '',
  size = 'default',
  className,
  inline = false,
  showTaxBreakup = true,
}: PriceWithTaxProps) {
  const { base, tax } = splitTotalIntoBaseAndTax(amount)
  const baseStr = formatPrice(base)
  const taxStr = formatPrice(tax)
  const totalStr = formatPrice(amount)

  const sizeClasses = {
    sm: 'text-sm',
    default: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  }[size]

  const taxSizeClasses = {
    sm: 'text-[10px]',
    default: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
    '2xl': 'text-lg',
  }[size]

  const content = showTaxBreakup ? (
    <>
      <span className={cn(sizeClasses, 'font-medium text-foreground')}>
        {currency}
        {baseStr}
      </span>
      <span className={cn(taxSizeClasses, 'ml-1 font-normal text-muted-foreground')} aria-hidden>
        + {currency}
        {taxStr}
      </span>
      {suffix && (
        <span className={cn(sizeClasses, 'text-muted-foreground')}>{suffix}</span>
      )}
    </>
  ) : (
    <>
      <span className={cn(sizeClasses, 'font-medium text-foreground')}>
        {currency}
        {totalStr}
      </span>
      {suffix && (
        <span className={cn(sizeClasses, 'text-muted-foreground')}>{suffix}</span>
      )}
    </>
  )

  if (inline) {
    return <span className={cn('inline', className)}>{content}</span>
  }
  return <span className={cn('inline-flex flex-wrap items-baseline gap-0.5', className)}>{content}</span>
}
