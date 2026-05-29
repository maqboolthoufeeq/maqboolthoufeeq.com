import { prisma } from '@/lib/prisma'

const CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  publishedAt: true,
  coverImage: true,
  tags: { select: { id: true, name: true, slug: true } },
} as const

export type RelatedPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  publishedAt: Date | null
  coverImage: string | null
  tags: { id: string; name: string; slug: string }[]
}

/**
 * Posts most similar to the current one, ranked by number of shared tags.
 * Falls back to recent posts when there aren't enough tag matches, so the
 * section is never empty as long as other posts exist.
 */
export async function getRelatedPosts(
  slug: string,
  tagSlugs: string[],
  limit = 3,
): Promise<RelatedPost[]> {
  const picked: RelatedPost[] = []
  const seen = new Set<string>([slug])

  if (tagSlugs.length > 0) {
    const candidates = await prisma.post.findMany({
      where: {
        published: true,
        slug: { not: slug },
        tags: { some: { slug: { in: tagSlugs } } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      select: CARD_SELECT,
    })

    const ranked = candidates
      .map((post) => ({
        post,
        overlap: post.tags.filter((t) => tagSlugs.includes(t.slug)).length,
      }))
      .sort((a, b) => {
        if (b.overlap !== a.overlap) return b.overlap - a.overlap
        const at = a.post.publishedAt?.getTime() ?? 0
        const bt = b.post.publishedAt?.getTime() ?? 0
        return bt - at
      })

    for (const { post } of ranked) {
      if (picked.length >= limit) break
      picked.push(post)
      seen.add(post.slug)
    }
  }

  if (picked.length < limit) {
    const fillers = await prisma.post.findMany({
      where: { published: true, slug: { notIn: [...seen] } },
      orderBy: { publishedAt: 'desc' },
      take: limit - picked.length,
      select: CARD_SELECT,
    })
    picked.push(...fillers)
  }

  return picked
}

export type AdjacentPost = { title: string; slug: string }

/**
 * The chronologically neighbouring posts. `previous` is the older post,
 * `next` is the newer one. Either may be null at the ends of the timeline.
 */
export async function getAdjacentPosts(
  slug: string,
  publishedAt: Date | null,
): Promise<{ previous: AdjacentPost | null; next: AdjacentPost | null }> {
  if (!publishedAt) return { previous: null, next: null }

  const [previous, next] = await Promise.all([
    prisma.post.findFirst({
      where: { published: true, slug: { not: slug }, publishedAt: { lt: publishedAt } },
      orderBy: { publishedAt: 'desc' },
      select: { title: true, slug: true },
    }),
    prisma.post.findFirst({
      where: { published: true, slug: { not: slug }, publishedAt: { gt: publishedAt } },
      orderBy: { publishedAt: 'asc' },
      select: { title: true, slug: true },
    }),
  ])

  return { previous, next }
}
