import type { Metadata } from 'next'

import { BlogAdminClient } from '@/app/internal/blogs-admin/BlogAdminClient'
import { listAllBlogPostsAdmin } from '@/lib/blogAdmin'
import { getBlogAdminSession } from '@/lib/blogAdminAuth'
import { Container } from '@/components/Container'

export const metadata: Metadata = {
  title: 'Blog Admin',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function BlogAdminPage() {
  const authorized = await getBlogAdminSession()
  const posts = authorized ? await listAllBlogPostsAdmin() : []

  return (
    <section className="section-rule">
      <Container className="py-12 sm:py-16">
        <BlogAdminClient authorized={authorized} posts={posts} />
      </Container>
    </section>
  )
}
