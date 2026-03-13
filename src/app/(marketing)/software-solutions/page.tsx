import type { Metadata } from 'next'

import { Container } from '@/components/Container'

export const metadata: Metadata = {
  title: 'Software Solutions',
  description: 'Explore software solutions and digital tools by Zenvana.',
}

export default function SoftwareSolutionsPage() {
  return (
    <div className="section-rule">
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-3xl">
          <div className="eyebrow">Software & digital</div>
          <h1 className="display-title mt-3 text-3xl sm:text-4xl lg:text-5xl">
            Software Solutions
          </h1>
          <p className="body-copy mt-4 text-muted-foreground">
            This is a placeholder page for Zenvana&apos;s software solutions. Use this space
            to describe products, platforms, or tools you offer to guests or partners.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="quiet-card p-6">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Product overview
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Summarise the type of software you provide, such as booking engines, guest
              apps, or property tools.
            </p>
          </div>

          <div className="quiet-card p-6">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Key benefits
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Highlight how your solutions make operations smoother or stays more
              intuitive for guests.
            </p>
          </div>

          <div className="quiet-card p-6">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Next steps
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Use this area for call-to-actions like booking a demo, requesting access, or
              contacting your team.
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}

