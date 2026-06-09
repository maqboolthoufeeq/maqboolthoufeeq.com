import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getSiteUrl } from '@/lib/utils'

// Generated per-request so new posts appear in the sitemap automatically.
export const dynamic = 'force-dynamic'

/**
 * True when a URL is an absolute http(s) link containing no XML-special
 * characters (& < > " '). Next.js 16 does NOT entity-escape the <image:loc>
 * it emits for the sitemap `images` field, so a cover-image URL with a raw `&`
 * (e.g. a signed/query-string image such as LinkedIn's `?e=…&v=…&t=…`) would
 * produce malformed XML and break the ENTIRE sitemap. We therefore only attach
 * cover images whose URL is safe to embed verbatim.
 */
function isXmlSafeImageUrl(url: string | null | undefined): url is string {
  return !!url && /^https?:\/\//i.test(url) && !/[&<>"']/.test(url)
}

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
      // Image sitemap entry — only for URLs that are safe to embed raw in XML
      // (Next does not escape <image:loc>; an unescaped & breaks the sitemap).
      ...(isXmlSafeImageUrl(p.coverImage) ? { images: [p.coverImage] } : {}),
    }))
  } catch {
    // If the database is briefly unreachable, still serve the static sitemap
    // rather than failing the whole route.
  }

  // Link Hub: include /hub and every published topic page. Only emitted when at
  // least one topic is published, so an unused hub adds no thin pages.
  const hubRoutes: MetadataRoute.Sitemap = []
  try {
    const topics = await prisma.hubTopic.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { order: 'asc' },
    })
    if (topics.length > 0) {
      hubRoutes.push({ url: `${base}/hub`, changeFrequency: 'weekly', priority: 0.5 })
      for (const t of topics) {
        hubRoutes.push({
          url: `${base}/hub/${t.slug}`,
          lastModified: t.updatedAt ?? undefined,
          changeFrequency: 'monthly',
          priority: 0.4,
        })
      }
    }
  } catch {
    // Hub is optional; skip its routes if the tables are unreachable.
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

  return [...staticRoutes, ...postRoutes, ...hubRoutes, ...mediaRoutes]
}
