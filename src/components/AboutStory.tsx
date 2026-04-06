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
            About Zenvana Hotels: Redefining Hospitality in the Hills
          </h1>

          <div className="body-copy mt-6 space-y-5">
            <p>
              Welcome to Zenvana Hotels, a premier chain of boutique properties dedicated to
              providing the best hotels in Dehradun. Nestled between the vibrant energy of Rajpur
              Road and the tranquil foothills of Mussoorie, Zenvana is more than just a place to
              stay - it is a sanctuary designed for slow living, where every detail is crafted for
              your comfort, mood, and time.
            </p>
            <h2 className="display-title pt-2 text-2xl font-semibold leading-tight sm:text-3xl">
              Our Story: A Vision of Serenity
            </h2>
            <p>
              Zenvana was founded with a simple goal: to create a collection of stays that feel
              deeply rooted in Dehradun&apos;s unique charm. We recognized a need for spaces that offer
              both modern convenience and a peaceful escape.
            </p>
            <p>
              Today, our chain features seven distinct properties - Hotel Silverwood, Rosewood,
              Monte Verde, Cherrywood, Silkwood, Limewood, and Serenewood - each offering its own
              personality while maintaining the signature Zenvana standard of warmth and
              excellence.
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

