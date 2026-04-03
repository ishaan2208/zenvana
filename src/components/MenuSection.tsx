'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'

import { MenuItem } from '@/components/MenuItem'

type MenuItemData = {
  name: string
  price: string
}

type MenuData = Record<string, MenuItemData[]>

type MenuSectionProps = {
  menuData: MenuData
}

const tabs = [
  { id: 'all', label: 'All', category: null },
  { id: 'tea-coffee', label: 'Tea/Coffee', category: 'Tea & Coffee' },
  { id: 'chinese', label: 'Chinese', category: 'Chinese Starter' },
  { id: 'appetizers', label: 'Appetizers', category: 'Appetizers & Salad' },
  { id: 'breakfast', label: 'Breakfast', category: 'Breakfast' },
  { id: 'pizza', label: 'Pizza', category: 'Pizza & Pasta' },
  { id: 'veg-main', label: 'Veg Main', category: 'Veg Main Course' },
  { id: 'non-veg', label: 'Non Veg', category: 'Non Veg Main Course' },
  { id: 'tandoori', label: 'Tandoori', category: 'Tandoori' },
  { id: 'breads', label: 'Breads', category: 'Breads' },
  { id: 'thali', label: 'Thali', category: 'Choice of Thali' },
  { id: 'rice-biryani', label: 'Rice & Biryani', category: 'Rice & Biryani' },
] as const

export function MenuSection({ menuData }: MenuSectionProps) {
  const categories = useMemo(() => Object.keys(menuData), [menuData])
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('all')
  const topRef = useRef<HTMLDivElement | null>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  const tabByCategory = useMemo(() => {
    const map = new Map<string, (typeof tabs)[number]['id']>()
    tabs.forEach((tab) => {
      if (tab.category) map.set(tab.category, tab.id)
    })
    return map
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible.length === 0) return

        const category = visible[0].target.getAttribute('data-category')
        if (!category) return
        setActiveTab(tabByCategory.get(category) ?? 'all')
      },
      {
        root: null,
        rootMargin: '-30% 0px -55% 0px',
        threshold: [0.2, 0.4, 0.7],
      },
    )

    categories.forEach((category) => {
      const el = sectionRefs.current[category]
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [categories, tabByCategory])

  const scrollToTab = (tabId: (typeof tabs)[number]['id']) => {
    setActiveTab(tabId)
    const tab = tabs.find((item) => item.id === tabId)
    if (!tab) return

    if (!tab.category) {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    sectionRefs.current[tab.category]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const showcaseItems: Array<{ name: string; image: string }> = [
    { name: 'Butter Chicken', image: '/images/dehradun/IMG_4668.jpg' },
    { name: 'Paneer Tikka', image: '/images/dehradun/feasta.png' },
    { name: 'Chicken Biryani', image: '/images/dehradun/MonteVerde.png' },
    { name: 'Cold Coffee', image: '/images/dehradun/Rosewood.png' },
  ]

  return (
    <div ref={topRef}>
      <section className="section-rule brand-gradient">
        <div className="container-shell py-14 text-center sm:py-16 lg:py-20">
          <h1 className="display-title text-4xl font-semibold text-white sm:text-5xl">
            Our Menu
          </h1>
          <p className="mt-4 text-base text-white/85 sm:text-lg">
            Freshly prepared with love
          </p>
          <a
            href="tel:9997330343"
            className="site-button-light mt-7 border-white/25 bg-white/12 text-white hover:bg-white/18"
          >
            To Order Call: 9997330343
          </a>
        </div>
      </section>

      <section className="container-shell py-8 sm:py-10">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {showcaseItems.map((dish) => (
            <article key={dish.name} className="quiet-card relative overflow-hidden rounded-2xl">
              <div className="relative aspect-[4/3]">
                {/* REPLACE WITH YOUR IMAGE */}
                <Image src={dish.image} alt={dish.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <h2 className="absolute bottom-3 left-3 right-3 font-serif text-lg font-semibold text-white">
                  {dish.name}
                </h2>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sticky top-[72px] z-20 border-y border-border/70 bg-background/95 backdrop-blur">
        <div className="container-shell py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => scrollToTab(tab.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/70 bg-card/80 text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container-shell pb-24 pt-8 sm:pt-10 lg:pb-28">
        <div className="space-y-10">
          {categories.map((category) => (
            <section
              key={category}
              data-category={category}
              ref={(el) => {
                sectionRefs.current[category] = el
              }}
              className="scroll-mt-36"
            >
              <div className="inline-flex rounded-md bg-primary px-5 py-2 shadow-[0_8px_18px_rgba(0,31,63,0.2)]">
                <h2 className="font-serif text-xl font-semibold text-primary-foreground sm:text-2xl">
                  {category}
                </h2>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
                {menuData[category].map((item) => (
                  <MenuItem key={`${category}-${item.name}`} item={item} category={category} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <a
        href="tel:9997330343"
        className="site-button-dark fixed bottom-5 right-5 z-40 shadow-[0_12px_25px_rgba(0,31,63,0.3)]"
      >
        📞 Order Now: 9997330343
      </a>
    </div>
  )
}

