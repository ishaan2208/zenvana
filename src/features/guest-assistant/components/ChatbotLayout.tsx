'use client'

import type { ReactNode } from 'react'

import Header from './Header'

export default function ChatbotLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex h-dvh flex-col bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
      <Header />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-2 pt-20 sm:px-1">
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
