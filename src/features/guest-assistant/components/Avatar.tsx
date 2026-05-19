'use client'

import type { FC } from 'react'
import { Bot, User } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

type Sender = 'bot' | 'guest' | 'typing'

interface ChatAvatarProps {
  sender: Sender
  src?: string
  name?: string
  online?: boolean
  size?: 'sm' | 'md' | 'lg'
  ring?: boolean
}

const sizeMap: Record<NonNullable<ChatAvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-[12px]',
  md: 'h-9 w-9 text-[12px]',
  lg: 'h-10 w-10 text-[13px]',
}

const pixelSizeMap: Record<NonNullable<ChatAvatarProps['size']>, number> = {
  sm: 32,
  md: 36,
  lg: 40,
}

function nameToInitials(name?: string) {
  if (!name) return '•'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0]
  const second = parts[1]?.[0]
  return (first ?? '').concat(second ?? '').toUpperCase() || '•'
}

const ChatAvatar: FC<ChatAvatarProps> = ({
  sender,
  src,
  name,
  online = false,
  size = 'md',
  ring = true,
}) => {
  const isBot = sender === 'bot'

  return (
    <div className="relative inline-flex">
      <div
        className={cn(
          sizeMap[size],
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full',
          ring && 'ring-1 ring-black/10 dark:ring-white/15',
          isBot
            ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 text-white'
            : 'bg-muted text-foreground dark:bg-slate-900 dark:text-slate-100',
        )}
        aria-label={isBot ? 'Zenvana Concierge' : name || 'Guest'}
      >
        {src ? (
          <Image
            src={src}
            alt={name || sender}
            fill
            sizes={`${pixelSizeMap[size]}px`}
            className="object-cover"
          />
        ) : isBot ? (
          <Bot className="h-4 w-4" aria-hidden="true" />
        ) : name ? (
          <span className="font-medium">{nameToInitials(name)}</span>
        ) : (
          <User className="h-4 w-4" aria-hidden="true" />
        )}
      </div>

      {online && (
        <span
          className="absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background"
          aria-hidden="true"
        />
      )}
    </div>
  )
}

export default ChatAvatar
