import { prisma } from '@/lib/prisma'

export interface SearchResult {
  id: string
  type: 'post' | 'project' | 'hub_topic' | 'hub_item' | 'reel' | 'video'
  title: string
  href: string
  excerpt?: string
  imageUrl?: string
  icon?: string
  badge: string
  rank: number
}

interface RawPost {
  id: string; title: string; slug: string; excerpt: string | null; cover_image: string | null; rank: number
}
interface RawProject {
  id: string; title: string; description: string; image_url: string | null; rank: number
}
interface RawHubTopic {
  id: string; title: string; slug: string; description: string | null; icon: string | null; cover_image: string | null; rank: number
}
interface RawHubItem {
  id: string; title: string; description: string | null; topic_slug: string; thumbnail: string | null; rank: number
}
interface RawMediaItem {
  id: string; title: string; description: string | null; platform: string; embed_id: string; thumbnail_url: string | null; category_slug: string | null; rank: number
}

async function searchFTS(query: string, limit: number): Promise<SearchResult[]> {
  const cap = Math.min(limit, 20)

  const [posts, projects, topics, items, media] = await Promise.all([
    prisma.$queryRaw<RawPost[]>`
      SELECT id, title, slug, excerpt, "coverImage" AS cover_image,
        ts_rank(
          to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,'')),
          websearch_to_tsquery('english', ${query})
        ) AS rank
      FROM "Post"
      WHERE published = true
        AND to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,''))
          @@ websearch_to_tsquery('english', ${query})
      ORDER BY rank DESC LIMIT ${cap}
    `,
    prisma.$queryRaw<RawProject[]>`
      SELECT id, title, description, "imageUrl" AS image_url,
        ts_rank(
          to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(array_to_string(tech, ' '),'')),
          websearch_to_tsquery('english', ${query})
        ) AS rank
      FROM "Project"
      WHERE to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(array_to_string(tech, ' '),''))
          @@ websearch_to_tsquery('english', ${query})
      ORDER BY rank DESC LIMIT ${cap}
    `,
    prisma.$queryRaw<RawHubTopic[]>`
      SELECT id, title, slug, description, icon, "coverImage" AS cover_image,
        ts_rank(
          to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')),
          websearch_to_tsquery('english', ${query})
        ) AS rank
      FROM "HubTopic"
      WHERE published = true
        AND to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
          @@ websearch_to_tsquery('english', ${query})
      ORDER BY rank DESC LIMIT ${cap}
    `,
    prisma.$queryRaw<RawHubItem[]>`
      SELECT hi.id, hi.title, hi.description, ht.slug AS topic_slug, hi.thumbnail,
        ts_rank(
          to_tsvector('english', coalesce(hi.title,'') || ' ' || coalesce(hi.description,'')),
          websearch_to_tsquery('english', ${query})
        ) AS rank
      FROM "HubItem" hi
      JOIN "HubTopic" ht ON ht.id = hi."topicId"
      WHERE hi.published = true AND ht.published = true
        AND to_tsvector('english', coalesce(hi.title,'') || ' ' || coalesce(hi.description,''))
          @@ websearch_to_tsquery('english', ${query})
      ORDER BY rank DESC LIMIT ${cap}
    `,
    prisma.$queryRaw<RawMediaItem[]>`
      SELECT mi.id, mi.title, mi.description, mi.platform, mi."embedId" AS embed_id,
        mi."thumbnailUrl" AS thumbnail_url, mc.slug AS category_slug,
        ts_rank(
          to_tsvector('english', coalesce(mi.title,'') || ' ' || coalesce(mi.description,'')),
          websearch_to_tsquery('english', ${query})
        ) AS rank
      FROM "MediaItem" mi
      LEFT JOIN "MediaCategory" mc ON mc.id = mi."categoryId"
      WHERE mi.published = true
        AND to_tsvector('english', coalesce(mi.title,'') || ' ' || coalesce(mi.description,''))
          @@ websearch_to_tsquery('english', ${query})
      ORDER BY rank DESC LIMIT ${cap}
    `,
  ])

  const results: SearchResult[] = [
    ...posts.map(p => ({
      id: p.id, type: 'post' as const, title: p.title,
      href: `/blog/${p.slug}`, excerpt: p.excerpt ?? undefined,
      imageUrl: p.cover_image ?? undefined, badge: 'Blog', rank: Number(p.rank),
    })),
    ...projects.map(p => ({
      id: p.id, type: 'project' as const, title: p.title,
      href: '/projects', excerpt: p.description,
      imageUrl: p.image_url ?? undefined, badge: 'Project', rank: Number(p.rank),
    })),
    ...topics.map(t => ({
      id: t.id, type: 'hub_topic' as const, title: t.title,
      href: `/hub/${t.slug}`, excerpt: t.description ?? undefined,
      imageUrl: t.cover_image ?? undefined, icon: t.icon ?? undefined,
      badge: 'Hub', rank: Number(t.rank),
    })),
    ...items.map(i => ({
      id: i.id, type: 'hub_item' as const, title: i.title,
      href: `/hub/${i.topic_slug}`, excerpt: i.description ?? undefined,
      imageUrl: i.thumbnail ?? undefined, badge: 'Hub', rank: Number(i.rank),
    })),
    ...media.map(m => {
      const isYt = m.platform === 'youtube'
      const imageUrl = m.thumbnail_url ?? (isYt ? `https://img.youtube.com/vi/${m.embed_id}/mqdefault.jpg` : undefined)
      const base = isYt ? '/videos' : '/reels'
      return {
        id: m.id, type: (isYt ? 'video' : 'reel') as 'video' | 'reel', title: m.title,
        href: m.category_slug ? `${base}/${m.category_slug}` : base,
        excerpt: m.description ?? undefined, imageUrl: imageUrl ?? undefined,
        badge: isYt ? 'Video' : 'Reel', rank: Number(m.rank),
      }
    }),
  ]

  return results.sort((a, b) => b.rank - a.rank)
}

async function searchFallback(query: string, limit: number): Promise<SearchResult[]> {
  const q = query.trim()
  const cap = Math.min(limit, 20)

  const [posts, projects, topics, items, media] = await Promise.all([
    prisma.post.findMany({
      where: { published: true, OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ] },
      select: { id: true, title: true, slug: true, excerpt: true, coverImage: true },
      take: cap, orderBy: { publishedAt: 'desc' },
    }),
    prisma.project.findMany({
      where: { OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ] },
      select: { id: true, title: true, description: true, imageUrl: true },
      take: cap,
    }),
    prisma.hubTopic.findMany({
      where: { published: true, OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ] },
      select: { id: true, title: true, slug: true, description: true, icon: true, coverImage: true },
      take: cap,
    }),
    prisma.hubItem.findMany({
      where: { published: true, topic: { published: true }, OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ] },
      select: { id: true, title: true, description: true, thumbnail: true, topic: { select: { slug: true } } },
      take: cap,
    }),
    prisma.mediaItem.findMany({
      where: { published: true, OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ] },
      select: { id: true, title: true, description: true, platform: true, embedId: true, thumbnailUrl: true, category: { select: { slug: true } } },
      take: cap,
    }),
  ])

  return [
    ...posts.map(p => ({
      id: p.id, type: 'post' as const, title: p.title,
      href: `/blog/${p.slug}`, excerpt: p.excerpt ?? undefined,
      imageUrl: p.coverImage ?? undefined, badge: 'Blog', rank: 0,
    })),
    ...projects.map(p => ({
      id: p.id, type: 'project' as const, title: p.title,
      href: '/projects', excerpt: p.description ?? undefined,
      imageUrl: p.imageUrl ?? undefined, badge: 'Project', rank: 0,
    })),
    ...topics.map(t => ({
      id: t.id, type: 'hub_topic' as const, title: t.title,
      href: `/hub/${t.slug}`, excerpt: t.description ?? undefined,
      imageUrl: t.coverImage ?? undefined, icon: t.icon ?? undefined,
      badge: 'Hub', rank: 0,
    })),
    ...items.map(i => ({
      id: i.id, type: 'hub_item' as const, title: i.title,
      href: `/hub/${i.topic.slug}`, excerpt: i.description ?? undefined,
      imageUrl: i.thumbnail ?? undefined, badge: 'Hub', rank: 0,
    })),
    ...media.map(m => {
      const isYt = m.platform === 'youtube'
      const imageUrl = m.thumbnailUrl ?? (isYt ? `https://img.youtube.com/vi/${m.embedId}/mqdefault.jpg` : undefined)
      const base = isYt ? '/videos' : '/reels'
      return {
        id: m.id, type: (isYt ? 'video' : 'reel') as 'video' | 'reel', title: m.title,
        href: m.category?.slug ? `${base}/${m.category.slug}` : base,
        excerpt: m.description ?? undefined, imageUrl: imageUrl ?? undefined,
        badge: isYt ? 'Video' : 'Reel', rank: 0,
      }
    }),
  ]
}

export async function search(
  query: string,
  limit = 10,
): Promise<{ results: SearchResult[]; total: number }> {
  const q = query.trim()
  if (!q || q.length < 2) return { results: [], total: 0 }

  try {
    const results = await searchFTS(q, limit)
    return { results: results.slice(0, limit), total: results.length }
  } catch (err) {
    console.error('[search] FTS error, falling back to ILIKE:', err)
    try {
      const results = await searchFallback(q, limit)
      return { results: results.slice(0, limit), total: results.length }
    } catch (err2) {
      console.error('[search] Fallback error:', err2)
      return { results: [], total: 0 }
    }
  }
}
