'use client'

import { useEffect, useRef, useState } from 'react'
import { ChefHat, Smile, Utensils } from 'lucide-react'

type Stat = {
  label: string
  value: number
  icon: React.ReactNode
}

function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setInView(true)
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return { ref, inView }
}

function AnimatedNumber({ value, start }: { value: number; start: boolean }) {
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!start) return
    const duration = 900
    const startTime = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setN(Math.round(value * eased))
      if (t < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [start, value])

  return <span>{n}</span>
}

export function RestaurantStats() {
  const { ref, inView } = useInView<HTMLDivElement>()

  const stats: Stat[] = [
    { label: 'Years of Experience', value: 12, icon: <ChefHat className="h-5 w-5" /> },
    { label: 'Available Dishes', value: 120, icon: <Utensils className="h-5 w-5" /> },
    { label: 'Happy Customers', value: 2400, icon: <Smile className="h-5 w-5" /> },
  ]

  return (
    <div ref={ref} className="grid gap-6 md:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="quiet-card p-6">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
            {s.icon}
          </div>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
            <AnimatedNumber value={s.value} start={inView} />
            {s.label === 'Years of Experience' ? '+' : ''}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

