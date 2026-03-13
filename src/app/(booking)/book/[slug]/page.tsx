import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { getPublicPropertyBySlug } from '@/lib/api'
import { Container } from '@/components/Container'
import { BookSearchForm } from './BookSearchForm'

type Props = { params: Promise<{ slug: string }> }

export default async function BookPropertyPage({ params }: Props) {
  const { slug } = await params
  const property = await getPublicPropertyBySlug(slug)
  if (!property) notFound()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Container className="py-4 sm:py-8 lg:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          <aside className="order-2 hidden min-w-0 lg:order-1 lg:block">
            <div className="rounded-[1.8rem] border border-border/60 bg-card/70 p-6 text-card-foreground shadow-[0_14px_35px_rgba(8,17,31,0.04)] dark:bg-card/50 lg:sticky lg:top-8">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Stay summary
              </div>
              <h2 className="mt-3 font-serif text-2xl tracking-[-0.04em] text-foreground">
                {property.publicName}
              </h2>

              {property.descriptionShort && (
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {property.descriptionShort}
                </p>
              )}

              <div className="mt-6 border-t border-border/60 pt-5">
                <Link
                  href={`/hotels/${slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to property
                </Link>
              </div>
            </div>
          </aside>

          <div className="order-1 min-w-0 lg:order-2">
            <BookSearchForm slug={slug} />
          </div>
        </div>
      </Container>
    </main>
  )
}

function MiniFeature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-card/70 p-5 text-card-foreground shadow-[0_12px_30px_rgba(8,17,31,0.03)] dark:bg-card/50">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-medium tracking-tight text-foreground">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p>
        </div>
      </div>
    </div>
  )
}