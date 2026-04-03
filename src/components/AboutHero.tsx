import Image from 'next/image'
import Link from 'next/link'

export function AboutHero() {
  return (
    <header className="relative min-h-[44svh] overflow-hidden">
      {/* REPLACE WITH YOUR IMAGE */}
      <Image
        src="/images/about-hero.jpg"
        alt="Wide banner view of the hotel exterior at sunset"
        fill
        priority
        className="object-cover"
      />
      <div className="hero-overlay absolute inset-0" />

      <div className="container-shell relative flex min-h-[44svh] items-end pb-8">
        <nav aria-label="Breadcrumb" className="text-sm text-white/85">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-white/70">
              &gt;
            </li>
            <li className="font-medium text-white">About Us</li>
          </ol>
        </nav>
      </div>
    </header>
  )
}

