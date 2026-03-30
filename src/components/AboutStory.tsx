'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
export function AboutStory() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="section-rule"
    >
      <div className="container-shell grid gap-10 py-14 sm:py-16 lg:grid-cols-12 lg:items-start lg:gap-12 lg:py-20">
        <div className="lg:col-span-7">
          <div className="eyebrow">About Us</div>
          <h1 className="display-title mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            A stay that feels calm, warm, and thoughtfully premium.
          </h1>

          <div className="body-copy mt-6 space-y-5">
            <p>
              Placeholder paragraph: Share your hotel story, values, and the atmosphere guests
              experience from the moment they arrive.
            </p>
            <p>
              Placeholder paragraph: Explain your hospitality approach, service standards, and the
              details that make every stay warm, comfortable, and memorable.
            </p>
            <p>
              Placeholder paragraph: Highlight your location, your signature offerings, and what
              makes your property ideal for both leisure and business travelers.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="editorial-image quiet-card relative aspect-[4/5]">
            {/* REPLACE WITH YOUR IMAGE */}
            <Image
              src="/images/about-story.jpg"
              alt="Elegant portrait-style image showing hotel interior details"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </motion.section>
  )
}

