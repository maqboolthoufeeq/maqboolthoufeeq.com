import { cache } from 'react'
import { prisma } from './prisma'
import {
  type Platform,
  type MediaLink,
  type MediaAttachment,
  sanitizeMediaLinks,
  sanitizeMediaAttachments,
} from './social'

/**
 * Plain, client-safe shape of a media item — every field is JSON-serialisable
 * so it can cross the server→client boundary into the carousel / card / modal.
 * (Importing this as `import type` keeps Prisma out of the client bundle.)
 */
export interface MediaCardData {
  id: string
  platform: Platform
  title: string
  description: string | null
  sourceUrl: string
  embedId: string
  thumbnailUrl: string | null
  previewVideoUrl: string | null
  featured: boolean
  categoryId: string | null
  categoryName: string | null
  /** ISO date to show publicly, or null when the admin hid it. */
  date: string | null
  /** ISO date always present (displayDate ?? createdAt) — drives sorting and the date filter. */
  sortDate: string
  /** Related links the admin attached (opens in a new tab). */
  links: MediaLink[]
  /** Downloadable / previewable files the admin attached. */
  attachments: MediaAttachment[]
}

export interface MediaCategoryGroup {
  id: string
  name: string
  slug: string
  items: MediaCardData[]
}

export interface MediaPageData {
  /** Every published item for the platform, in display order. */
  all: MediaCardData[]
  /** Featured items, surfaced in their own row at the top. */
  featured: MediaCardData[]
  /** One group per non-empty category, in the admin's chosen order. */
  groups: MediaCategoryGroup[]
  /** Items not assigned to any category. */
  uncategorized: MediaCardData[]
}

type MediaRow = {
  id: string
  platform: string
  title: string
  description: string | null
  sourceUrl: string
  embedId: string
  thumbnailUrl: string | null
  previewVideoUrl: string | null
  links: unknown
  attachments: unknown
  featured: boolean
  showDate: boolean
  displayDate: Date | null
  createdAt: Date
  categoryId: string | null
  category: { name: string } | null
}

function toCard(item: MediaRow): MediaCardData {
  return {
    id: item.id,
    platform: item.platform as Platform,
    title: item.title,
    description: item.description,
    sourceUrl: item.sourceUrl,
    embedId: item.embedId,
    thumbnailUrl: item.thumbnailUrl,
    previewVideoUrl: item.previewVideoUrl,
    featured: item.featured,
    categoryId: item.categoryId,
    categoryName: item.category?.name ?? null,
    date: item.showDate ? (item.displayDate ?? item.createdAt).toISOString() : null,
    sortDate: (item.displayDate ?? item.createdAt).toISOString(),
    links: sanitizeMediaLinks(item.links),
    attachments: sanitizeMediaAttachments(item.attachments),
  }
}

/** Category rows in display order, fetched once per request (the reels and
 *  videos sections each build their groups from the same list). */
const loadMediaCategories = cache(() =>
  prisma.mediaCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
)

/**
 * Items for a landing-page carousel: featured first, then the admin's order.
 * Capped so the homepage row stays light. Deduped per request.
 */
export const getMediaForLanding = cache(async (platform: Platform, take = 12): Promise<MediaCardData[]> => {
  const items = await prisma.mediaItem.findMany({
    where: { platform, published: true },
    orderBy: [{ featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
    take,
    include: { category: { select: { name: true } } },
  })
  return items.map(toCard)
})

/**
 * Everything needed for a /reels or /videos page: a featured row on top, then a
 * row per category (playlist-style), then any uncategorised items.
 */
export const getMediaPageData = cache(async (platform: Platform): Promise<MediaPageData> => {
  const [items, categories] = await Promise.all([
    prisma.mediaItem.findMany({
      where: { platform, published: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: { category: { select: { name: true } } },
    }),
    loadMediaCategories(),
  ])

  const all = items.map(toCard)
  const featured = all.filter((c) => c.featured)
  const groups: MediaCategoryGroup[] = categories
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      items: all.filter((c) => c.categoryId === cat.id),
    }))
    .filter((g) => g.items.length > 0)
  const uncategorized = all.filter((c) => !c.categoryId)

  return { all, featured, groups, uncategorized }
})

/** True when there is at least one published item of either platform. */
export const hasAnyMedia = cache(async (): Promise<boolean> => {
  const count = await prisma.mediaItem.count({ where: { published: true } })
  return count > 0
})

export interface TopicMedia {
  category: { id: string; name: string; slug: string }
  items: MediaCardData[]
}

/**
 * Every published item of one platform inside a single topic, for the dedicated
 * /reels/[slug] and /videos/[slug] pages. Returns null when the slug is unknown.
 */
export async function getTopicMedia(platform: Platform, slug: string): Promise<TopicMedia | null> {
  const category = await prisma.mediaCategory.findUnique({ where: { slug } })
  if (!category) return null

  const items = await prisma.mediaItem.findMany({
    where: { platform, published: true, categoryId: category.id },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    include: { category: { select: { name: true } } },
  })

  return {
    category: { id: category.id, name: category.name, slug: category.slug },
    items: items.map(toCard),
  }
}
