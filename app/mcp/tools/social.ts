import { prisma } from '@/lib/prisma'
import {
  isPlatform, detectPlatform, parseEmbedId, type Platform,
} from '@/lib/social'
import { fetchMediaMeta } from '@/lib/media-meta'
import { slugify, parseDateOrNull } from '@/lib/utils'
import type { ToolDef, ToolContent } from '../types'
import { text } from '../types'

const ITEM_SELECT = {
  id: true, platform: true, title: true, description: true, sourceUrl: true, embedId: true,
  thumbnailUrl: true, previewVideoUrl: true, links: true, attachments: true, featured: true, published: true,
  showDate: true, displayDate: true, order: true, categoryId: true,
  category: { select: { id: true, name: true, slug: true } },
} as const

async function resolveTopic(topicId?: string, topicName?: string): Promise<string | null> {
  if (topicId) return topicId
  if (!topicName?.trim()) return null
  const existing = await prisma.mediaCategory.findFirst({ where: { name: topicName.trim() } })
  if (existing) return existing.id
  const base = slugify(topicName.trim()) || 'topic'
  let slug = base
  for (let i = 2; await prisma.mediaCategory.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`
  const last = await prisma.mediaCategory.findFirst({ orderBy: { order: 'desc' } })
  const created = await prisma.mediaCategory.create({
    data: { name: topicName.trim(), slug, order: (last?.order ?? -1) + 1 },
  })
  return created.id
}

export const TOOLS: ToolDef[] = [
  {
    name: 'list_media',
    description:
      'List social media items (Instagram reels and YouTube videos/shorts) shown on the landing page, /reels and /videos. Optionally filter by platform or topic. Returns id, platform, title, topic, featured/published flags and order.',
    inputSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['instagram', 'youtube'], description: 'Filter to reels (instagram) or videos (youtube)' },
        topicId: { type: 'string', description: 'Filter to a single topic/category id' },
        includeHidden: { type: 'boolean', description: 'Include unpublished (draft) items (default true)' },
      },
    },
  },
  {
    name: 'get_media',
    description: 'Fetch a single reel/video by id with all its fields.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
  {
    name: 'add_media',
    description:
      'Add an Instagram reel or YouTube video/short from its public URL. The platform is auto-detected and the title, description and thumbnail are auto-fetched from the source (Instagram caption / YouTube title + description); Instagram thumbnails are re-hosted permanently. Pass any field to override the auto-fetched value. Use topicName to file it under a topic (created if missing), or topicId for an existing one.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Public reel/video/short URL, e.g. https://www.instagram.com/reel/ABC/ or https://youtube.com/watch?v=ID or /shorts/ID' },
        platform: { type: 'string', enum: ['instagram', 'youtube'], description: 'Override auto-detection (rarely needed)' },
        title: { type: 'string', description: 'Override the auto-fetched title' },
        description: { type: 'string', description: 'Override the auto-fetched description/caption' },
        thumbnailUrl: { type: 'string', description: 'Override the thumbnail (https). Recommended for Instagram if auto-fetch is blocked (age-restricted reels)' },
        topicId: { type: 'string', description: 'Existing topic/category id to file it under' },
        topicName: { type: 'string', description: 'Topic name to file it under (created if it does not exist)' },
        featured: { type: 'boolean', description: 'Surface it first, in the Featured row' },
        published: { type: 'boolean', description: 'Visible on the public site (default true)' },
        showDate: { type: 'boolean', description: 'Show a "date added" badge publicly' },
        displayDate: { type: 'string', description: 'The date to show (ISO/yyyy-mm-dd); defaults to now' },
        autofetch: { type: 'boolean', description: 'Auto-fetch metadata from the source (default true)' },
      },
      required: ['url'],
    },
  },
  {
    name: 'update_media',
    description:
      'Update any fields of an existing reel/video. Changing sourceUrl re-derives the embed id. Use categoryId (or null to clear) to change its topic.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        sourceUrl: { type: 'string', description: 'New reel/video URL (re-parses the embed id)' },
        thumbnailUrl: { type: 'string' },
        featured: { type: 'boolean' },
        published: { type: 'boolean' },
        showDate: { type: 'boolean' },
        displayDate: { type: 'string', description: 'ISO/yyyy-mm-dd, or empty to clear' },
        order: { type: 'number' },
        categoryId: { type: ['string', 'null'], description: 'Topic id, or null to make it uncategorised' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_media',
    description: 'Permanently delete a reel/video.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
  {
    name: 'reorder_media',
    description: 'Set the display order for multiple reels/videos at once (lower = shown first within its platform/topic).',
    inputSchema: {
      type: 'object',
      properties: {
        order: {
          type: 'array',
          description: 'Array of { id, order } pairs',
          items: { type: 'object', properties: { id: { type: 'string' }, order: { type: 'number' } }, required: ['id', 'order'] },
        },
      },
      required: ['order'],
    },
  },
  {
    name: 'list_topics',
    description: 'List social media topics (playlist-style groups), with their ids, slugs, order and item counts.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_topic',
    description: 'Create a social media topic. The slug is auto-generated and unique.',
    inputSchema: { type: 'object', properties: { name: { type: 'string', description: 'e.g. "Travel", "Tutorials"' } }, required: ['name'] },
  },
  {
    name: 'update_topic',
    description: 'Rename a topic and/or change its order on the view-all pages.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' }, order: { type: 'number' } },
      required: ['id'],
    },
  },
  {
    name: 'delete_topic',
    description: 'Delete a topic. Its reels/videos are kept but become uncategorised.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
]

export async function handle(name: string, args: Record<string, unknown>): Promise<ToolContent[]> {
  switch (name) {
    case 'list_media': {
      const { platform, topicId, includeHidden } = args as { platform?: string; topicId?: string; includeHidden?: boolean }
      const items = await prisma.mediaItem.findMany({
        where: {
          ...(isPlatform(platform) ? { platform } : {}),
          ...(topicId ? { categoryId: topicId } : {}),
          ...(includeHidden === false ? { published: true } : {}),
        },
        orderBy: [{ platform: 'asc' }, { order: 'asc' }],
        select: ITEM_SELECT,
      })
      return text(items)
    }

    case 'get_media': {
      const { id } = args as { id: string }
      const item = await prisma.mediaItem.findUnique({ where: { id }, select: ITEM_SELECT })
      if (!item) throw new Error(`Media item not found: ${id}`)
      return text(item)
    }

    case 'add_media': {
      const a = args as {
        url: string; platform?: string; title?: string; description?: string; thumbnailUrl?: string
        topicId?: string; topicName?: string; featured?: boolean; published?: boolean
        showDate?: boolean; displayDate?: string; autofetch?: boolean
      }
      if (!a.url?.trim()) throw new Error('url is required')
      const platform: Platform | null = isPlatform(a.platform) ? a.platform : detectPlatform(a.url)
      if (!platform) throw new Error('Could not detect platform — pass a YouTube or Instagram URL')
      const embedId = parseEmbedId(platform, a.url)
      if (!embedId) throw new Error(`Could not read a ${platform} id from that URL`)

      let title = a.title
      let description = a.description
      let thumbnailUrl = a.thumbnailUrl
      let note = ''
      if (a.autofetch !== false) {
        const meta = await fetchMediaMeta(platform, embedId)
        if (meta.blocked) note = `\n(Note: ${meta.blockedReason || 'source did not share details — add title/thumbnail manually'})`
        title = title ?? meta.title ?? undefined
        description = description ?? meta.description ?? undefined
        thumbnailUrl = thumbnailUrl ?? meta.thumbnailUrl ?? undefined
      }
      if (!title?.trim()) title = platform === 'youtube' ? 'Untitled video' : 'Untitled reel'

      const categoryId = await resolveTopic(a.topicId, a.topicName)

      const item = await prisma.mediaItem.create({
        data: {
          platform, title: title.trim(), description: description?.trim() || null,
          sourceUrl: a.url.trim(), embedId, thumbnailUrl: thumbnailUrl?.trim() || null,
          featured: Boolean(a.featured),
          published: a.published === undefined ? true : Boolean(a.published),
          showDate: Boolean(a.showDate), displayDate: parseDateOrNull(a.displayDate),
          categoryId,
        },
        select: ITEM_SELECT,
      })
      return text(`Added ${platform === 'youtube' ? 'video' : 'reel'}.${note}\n${JSON.stringify(item, null, 2)}`)
    }

    case 'update_media': {
      const { id, sourceUrl, displayDate, categoryId, ...rest } = args as {
        id: string; sourceUrl?: string; displayDate?: string; categoryId?: string | null
        title?: string; description?: string; thumbnailUrl?: string; featured?: boolean
        published?: boolean; showDate?: boolean; order?: number
      }
      const existing = await prisma.mediaItem.findUnique({ where: { id } })
      if (!existing) throw new Error(`Media item not found: ${id}`)

      let embedId: string | undefined
      if (sourceUrl !== undefined) {
        const parsed = parseEmbedId(existing.platform as Platform, sourceUrl)
        if (!parsed) throw new Error(`Could not read a ${existing.platform} id from that URL`)
        embedId = parsed
      }

      const item = await prisma.mediaItem.update({
        where: { id },
        data: {
          ...rest,
          ...(sourceUrl !== undefined && { sourceUrl: sourceUrl.trim(), embedId }),
          ...(displayDate !== undefined && { displayDate: parseDateOrNull(displayDate) }),
          ...(categoryId !== undefined && { categoryId: categoryId || null }),
        },
        select: ITEM_SELECT,
      })
      return text(`Media item updated.\n${JSON.stringify(item, null, 2)}`)
    }

    case 'delete_media': {
      const { id } = args as { id: string }
      await prisma.mediaItem.delete({ where: { id } })
      return text(`Media item ${id} deleted.`)
    }

    case 'reorder_media': {
      const { order } = args as { order: Array<{ id: string; order: number }> }
      await Promise.all(order.map(({ id, order: o }) => prisma.mediaItem.update({ where: { id }, data: { order: o } })))
      return text(`Reordered ${order.length} media items.`)
    }

    case 'list_topics': {
      const topics = await prisma.mediaCategory.findMany({
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        include: { _count: { select: { items: true } } },
      })
      return text(topics)
    }

    case 'create_topic': {
      const { name: topicName } = args as { name: string }
      if (!topicName?.trim()) throw new Error('name is required')
      const id = await resolveTopic(undefined, topicName)
      if (!id) throw new Error('Failed to create topic')
      const topic = await prisma.mediaCategory.findUnique({ where: { id } })
      return text(`Topic created.\n${JSON.stringify(topic, null, 2)}`)
    }

    case 'update_topic': {
      const { id, name: topicName, order } = args as { id: string; name?: string; order?: number }
      const data: { name?: string; slug?: string; order?: number } = {}
      if (order !== undefined) data.order = Number(order)
      if (topicName !== undefined) {
        if (!topicName.trim()) throw new Error('name cannot be empty')
        data.name = topicName.trim()
        const base = slugify(topicName.trim()) || 'topic'
        let slug = base
        for (let i = 2; ; i++) {
          const clash = await prisma.mediaCategory.findUnique({ where: { slug } })
          if (!clash || clash.id === id) break
          slug = `${base}-${i}`
        }
        data.slug = slug
      }
      const topic = await prisma.mediaCategory.update({ where: { id }, data })
      return text(`Topic updated.\n${JSON.stringify(topic, null, 2)}`)
    }

    case 'delete_topic': {
      const { id } = args as { id: string }
      await prisma.mediaCategory.delete({ where: { id } })
      return text(`Topic ${id} deleted. Its items are now uncategorised.`)
    }

    default: throw new Error(`Unknown tool: ${name}`)
  }
}
