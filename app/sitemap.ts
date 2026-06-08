import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getSiteUrl } from '@/lib/utils'

// Generated per-request so new posts appear in the sitemap automatically.
export const dynamic = 'force-dynamic'

/**
 * XML sitemap (served at /sitemap.xml) listing the static pages, every
 * published blog post (with its cover image for Google image indexing) and the
 * reel/video topic pages that have published items. Uses the canonical site URL
 * — search engines follow redirects and prefer the canonical host. Referenced
 * from robots.txt.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()

  const staticRoutes: MetadataRoute.Sitemap = [
    // No trailing slash — matches the home page's canonical (buildPageMetadata
    // emits `${origin}` for path '/'), avoiding a duplicate-content signal.
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/blog`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/projects`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/reels`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/videos`, changeFrequency: 'weekly', priority: 0.5 },
  ]

  let postRoutes: MetadataRoute.Sitemap = []
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true, publishedAt: true, coverImage: true },
      orderBy: { publishedAt: 'desc' },
    })
    postRoutes = posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt ?? p.publishedAt ?? undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
      // Image sitemap entry — only absolute http(s) URLs are valid here.
      ...(p.coverImage && /^https?:\/\//i.test(p.coverImage) ? { images: [p.coverImage] } : {}),
    }))
  } catch {
    // If the database is briefly unreachable, still serve the static sitemap
    // rather than failing the whole route.
  }

  const mediaRoutes: MetadataRoute.Sitemap = []
  try {
    const categories = await prisma.mediaCategory.findMany({
      where: { items: { some: { published: true } } },
      select: {
        slug: true,
        updatedAt: true,
        items: { where: { published: true }, select: { platform: true } },
      },
    })
    for (const c of categories) {
      const lastModified = c.updatedAt ?? undefined
      if (c.items.some((i) => i.platform === 'instagram')) {
        mediaRoutes.push({ url: `${base}/reels/${c.slug}`, lastModified, changeFrequency: 'monthly', priority: 0.4 })
      }
      if (c.items.some((i) => i.platform === 'youtube')) {
        mediaRoutes.push({ url: `${base}/videos/${c.slug}`, lastModified, changeFrequency: 'monthly', priority: 0.4 })
      }
    }
  } catch {
    // Topic pages are optional; skip them if the media tables are unreachable.
  }

  return [...staticRoutes, ...postRoutes, ...mediaRoutes]
}
