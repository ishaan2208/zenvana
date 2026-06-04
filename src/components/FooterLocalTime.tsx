'use client'

import { useEffect, useState } from 'react'

/**
 * Live local time on Rajpur Road (Asia/Kolkata). A small "we're here, right now"
 * signal in the footer. Renders a placeholder until mounted to avoid a
 * server/client hydration mismatch (the server has no single "now").
 */
export function FooterLocalTime() {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }).format(new Date())
    setTime(fmt())
    const id = setInterval(() => setTime(fmt()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="tabular-nums text-sand-50/90" suppressHydrationWarning>
      {time ?? '——'}
    </span>
  )
}
