import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getSiteUrl } from '@/lib/utils'

// Generated per-request so new posts appear in the sitemap automatically.
export const dynamic = 'force-dynamic'

/**
 * XML sitemap (served at /sitemap.xml) listing the static pages plus every
 * published blog post. Uses the canonical site URL — search engines follow
 * redirects and prefer the canonical host. Referenced from robots.txt.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()

  const staticRoutes: MetadataRoute.Sitemap = [
    // No trailing slash — matches the home page's canonical (buildPageMetadata
    // emits `${origin}` for path '/'), avoiding a duplicate-content signal.
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/blog`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/projects`, changeFrequency: 'weekly', priority: 0.7 },
  ]

  let postRoutes: MetadataRoute.Sitemap = []
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
    })
    postRoutes = posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt ?? p.publishedAt ?? undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))
  } catch {
    // If the database is briefly unreachable, still serve the static sitemap
    // rather than failing the whole route.
  }

  return [...staticRoutes, ...postRoutes]
}
