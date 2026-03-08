'use client'

import { motion } from 'framer-motion'
import { BadgeCheck, Headphones, Sparkles, WalletCards } from 'lucide-react'
import { Container } from '@/components/Container'

const points = [
  {
    title: 'Better value, not fake discount drama',
    description:
      'Direct booking reduces marketplace friction and helps you access the best value we can transparently offer.',
    icon: WalletCards,
  },
  {
    title: 'Speak to the property, not a ticket maze',
    description:
      'Need a request, update, or clarification? Reach the hotel team more directly and get things sorted faster.',
    icon: Headphones,
  },
  {
    title: 'A more thoughtful stay',
    description:
      'Zenvana properties are chosen for comfort, practicality, and warmth — useful for both couples and families.',
    icon: BadgeCheck,
  },
]

export function WhyBookDirect() {
  return (
    <section
      id="why-book-direct"
      aria-label="Why book direct with Zenvana"
      className="border-t border-border/60 bg-background py-16 sm:py-20"
    >
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Why book direct
            </div>

            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Premium hospitality should feel simple, not bureaucratic.
            </h2>

            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              The point of direct booking is not just price. It is clarity,
              speed, less friction, and a more human experience before you even
              arrive.
            </p>
          </div>

          <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-soft backdrop-blur">
            <p className="text-sm leading-7 text-muted-foreground">
              Zenvana is positioned best when the homepage feels less like a
              discount portal and more like a calm invitation into a reliable,
              beautifully-run hospitality system.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {points.map((item, index) => {
            const Icon = item.icon

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/80 p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-70"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(219,230,76,0.12), rgba(219,230,76,0))',
                  }}
                />

                <div className="relative">
                  <div className="inline-flex rounded-2xl border border-border/60 bg-background p-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}