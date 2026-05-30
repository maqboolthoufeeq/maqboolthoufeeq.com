import { prisma } from './prisma'

const SINGLETON = 'singleton'

export type SiteStats = { visitors: number; pageViews: number }

/** Reads the site-wide visitor counters, creating the row on first access. */
export async function getSiteStats(): Promise<SiteStats> {
  const row = await prisma.siteStats.upsert({
    where: { id: SINGLETON },
    create: { id: SINGLETON },
    update: {},
    select: { visitors: true, pageViews: true },
  })
  return row
}

/**
 * Records a public page view. `uniqueVisitor` is true the first time a given
 * browser is seen (no visitor cookie yet) — that also bumps the unique count.
 */
export async function recordVisit(uniqueVisitor: boolean): Promise<void> {
  await prisma.siteStats.upsert({
    where: { id: SINGLETON },
    create: { id: SINGLETON, pageViews: 1, visitors: uniqueVisitor ? 1 : 0 },
    update: {
      pageViews: { increment: 1 },
      ...(uniqueVisitor ? { visitors: { increment: 1 } } : {}),
    },
  })
}

/**
 * Atomically increments the read counter for a single published post.
 * Returns the updated view count, or null if the post doesn't exist / isn't
 * published. Abuse is kept in check client-side (one count per browser per post
 * via localStorage); this just performs the increment.
 */
export async function recordPostView(slug: string): Promise<number | null> {
  const post = await prisma.post.findFirst({
    where: { slug, published: true },
    select: { id: true },
  })
  if (!post) return null

  const updated = await prisma.post.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
    select: { views: true },
  })
  return updated.views
}
