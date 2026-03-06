'use client'

import Image from 'next/image'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import backgroundImage from '@/images/background-call-to-action.jpg'
import { track } from '@vercel/analytics'

export function CallToAction() {
  const handleSignUpClick = () => {
    track('clicked sign up', {
      location: 'cta',
    })
    window.location.href = '/hotels'
  }
  return (
    <section
      id="get-started-today"
      className="relative overflow-hidden bg-primary py-32"
    >
      <Image
        className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
        src={backgroundImage}
        alt=""
        width={2347}
        height={1244}
        unoptimized
      />
      <Container className="relative">
        {/* <iframe
          className=" h-96 w-full"
          src="https://asset.cloudinary.com/dr65ypq1p/088dd6b1279b9fc96311f228df4653d0"
          frameBorder="0"
          allowFullScreen
        /> */}
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
            Book your stay
          </h2>
          <p className="mt-4 text-lg tracking-tight text-primary-foreground/90">
            Zenvana Hotels offers boutique and family-friendly stays. Book direct for the best rates and a personal touch.
          </p>
          <Button onClick={handleSignUpClick} color="white" className="mt-10">
            View hotels
          </Button>
        </div>
      </Container>
    </section>
  )
}
