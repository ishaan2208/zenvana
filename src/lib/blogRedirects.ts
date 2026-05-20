import { prisma } from '@/lib/prisma'

export async function getBlogSlugRedirectTarget(fromSlug: string): Promise<string | null> {
  const redirect = await prisma.blogSlugRedirect.findUnique({
    where: { fromSlug },
    select: { toSlug: true },
  })
  return redirect?.toSlug ?? null
}

export async function recordBlogSlugRedirect(fromSlug: string, toSlug: string): Promise<void> {
  if (fromSlug === toSlug) return

  await prisma.$transaction([
    prisma.blogSlugRedirect.updateMany({
      where: { toSlug: fromSlug },
      data: { toSlug },
    }),
    prisma.blogSlugRedirect.upsert({
      where: { fromSlug },
      create: { fromSlug, toSlug },
      update: { toSlug },
    }),
  ])
}
