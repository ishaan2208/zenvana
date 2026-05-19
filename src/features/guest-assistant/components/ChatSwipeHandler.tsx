'use client'

import type { ReactNode } from 'react'

export function ChatSwipeHandler({
  children,
}: {
  children: ReactNode
  onBack?: () => void
  canGoBack?: boolean
  onRefresh?: () => void | Promise<void>
}) {
  return <div className="flex h-full min-h-0 flex-1 flex-col">{children}</div>
}
