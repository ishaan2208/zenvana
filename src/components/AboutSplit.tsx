'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
export function AboutSplit() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="section-rule"
    >
      <div className="container-shell pb-16 pt-14 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="editorial-image quiet-card relative aspect-[16/11]">
            {/* REPLACE WITH YOUR IMAGE */}
            <Image
              src="/images/about-interior.jpg"
              alt="Hotel interior seating and decor with warm lighting"
              fill
              className="object-cover"
            />
          </div>
          <div className="editorial-image quiet-card relative aspect-[16/11]">
            {/* REPLACE WITH YOUR IMAGE */}
            <Image
              src="/images/about-view.jpg"
              alt="Balcony and scenic view from the hotel property"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl text-center">
          <h2 className="display-title text-3xl font-semibold sm:text-4xl">
            Our Commitment to You
          </h2>
          <p className="body-copy mt-4">
            At Zenvana, we believe hospitality should be effortless. Our team is dedicated to
            providing attentive, unhurried service that makes you feel at home. Whether you are
            visiting for a weekend reset, a corporate meeting, or a long-term mountain getaway, we
            ensure your stay is defined by clean aesthetics, fresh Himalayan air, and genuine care.
          </p>
          <div className="mt-8">
            <Link href="/contact" className="site-button-dark">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

