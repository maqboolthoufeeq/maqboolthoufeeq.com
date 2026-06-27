/**
 * MCP tools for the Link Hub — full create/read/update/delete/list/reorder over
 * the hub's three entities:
 *
 *   • HubCategory — coloured facet chips used to group topics & blocks
 *   • HubTopic    — the nestable tree of topics / subtopics (Linktree-style)
 *   • HubItem     — the content blocks inside a topic (10 types: link, text,
 *                   markdown, richtext, image, video, audio, pdf, file, embed)
 *
 * Every write goes through the SAME canonical validators the admin API routes
 * use — {@link sanitizeHubItem} (per-type block validation + HTML sanitisation),
 * {@link HUB_LIMITS}, {@link slugify}, {@link parseDateOrNull}, {@link isHttpUrl}
 * — so a block created from an MCP client is byte-for-byte what the admin editor
 * would have stored: no unsafe scheme or markup ever reaches the database.
 *
 * Tool names are namespaced with `_hub_` because the social/media module already
 * owns `list_topics` / `create_topic` / … for its video playlists.
 */

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { slugify, parseDateOrNull } from '@/lib/utils'
import { isHttpUrl } from '@/lib/social'
import { sanitizePostHtml } from '@/lib/sanitize'
import { HUB_LIMITS, sanitizeHubItem } from '@/lib/hub-content'
import type { ToolContent } from '../types'
import { text } from '../types'

export { TOOLS } from './hub-defs'

const CATEGORY_SELECT = { select: { id: true, name: true, slug: true, color: true } } as const
const TAG_SELECT = { select: { id: true, name: true, slug: true } } as const
const COUNT_SELECT = { _count: { select: { children: true, items: true } } } as const

/* ─── Shared helpers (mirrors the inline helpers in app/api/hub/*) ─────────── */

/** Tags arrive as existing tag ids (use list_tags / create_tag to obtain them);
 *  connect by id and never trust arbitrary names. */
function tagConnect(tags: unknown) {
  return (Array.isArray(tags) ? tags : [])
    .filter((id: unknown): id is string => typeof id === 'string')
    .map((id) => ({ id }))
}

async function uniqueTopicSlug(base: string): Promise<string> {
  const root = slugify(base) || 'topic'
  let slug = root
  let n = 1
  while (await prisma.hubTopic.findUnique({ where: { slug } })) {
    n++
    slug = `${root}-${n}`
  }
  return slug
}

async function uniqueCategorySlug(base: string): Promise<string> {
  const root = slugify(base) || 'category'
  let slug = root
  let n = 1
  while (await prisma.hubCategory.findUnique({ where: { slug } })) {
    n++
    slug = `${root}-${n}`
  }
  return slug
}

/** True when making `candidateParent` the parent of `id` would form a cycle. */
async function wouldCycle(id: string, candidateParent: string): Promise<boolean> {
  let cur: string | null = candidateParent
  const seen = new Set<string>()
  while (cur) {
    if (cur === id) return true
    if (seen.has(cur)) return true
    seen.add(cur)
    const row: { parentId: string | null } | null = await prisma.hubTopic.findUnique({
      where: { id: cur },
      select: { parentId: true },
    })
    cur = row?.parentId ?? null
  }
  return false
}

const isHex = (c: string) => /^#[0-9a-fA-F]{6}$/.test(c)

/** Reject a non-existent category reference up front with a clear message rather
 *  than letting a Prisma foreign-key error surface as an opaque 500. No-ops when
 *  the id is empty/null (which means "clear the category"). */
async function ensureCategory(categoryId: unknown): Promise<void> {
  if (typeof categoryId === 'string' && categoryId && !(await prisma.hubCategory.findUnique({ where: { id: categoryId } }))) {
    throw new Error(`Category not found: ${categoryId}`)
  }
}

/* ─── Handler ────────────────────────────────────────────────────────────── */

export async function handle(name: string, args: Record<string, unknown>): Promise<ToolContent[]> {
  switch (name) {
    /* ── Categories ──────────────────────────────────────────────────────── */
    case 'list_hub_categories': {
      const categories = await prisma.hubCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] })
      return text(categories)
    }

    case 'create_hub_category': {
      const { name: catName, color } = args as { name?: string; color?: string }
      if (!catName?.trim() || catName.trim().length > HUB_LIMITS.categoryName) {
        throw new Error(`Name is required and must be under ${HUB_LIMITS.categoryName} characters`)
      }
      if (color != null && (typeof color !== 'string' || !isHex(color))) {
        throw new Error('Color must be a hex code like #FF5500')
      }
      const slug = await uniqueCategorySlug(catName)
      const category = await prisma.hubCategory.create({
        data: { name: catName.trim(), slug, color: color && isHex(color) ? color : null, order: 0 },
      })
      return text(`Category created.\n${JSON.stringify(category, null, 2)}`)
    }

    case 'update_hub_category': {
      const { id, name: catName, color, order } = args as { id: string; name?: string; color?: string | null; order?: number }
      if (!(await prisma.hubCategory.findUnique({ where: { id } }))) throw new Error(`Category not found: ${id}`)
      if (catName !== undefined && (typeof catName !== 'string' || !catName.trim() || catName.trim().length > HUB_LIMITS.categoryName)) {
        throw new Error(`Name must be non-empty and under ${HUB_LIMITS.categoryName} characters`)
      }
      if (color !== undefined && color !== null && (typeof color !== 'string' || !isHex(color))) {
        throw new Error('Color must be a hex code like #FF5500')
      }
      const category = await prisma.hubCategory.update({
        where: { id },
        data: {
          ...(catName !== undefined && { name: catName.trim() }),
          ...(color !== undefined && { color: color && isHex(color) ? color : null }),
          ...(order !== undefined && { order: Number(order) }),
        },
      })
      return text(`Category updated.\n${JSON.stringify(category, null, 2)}`)
    }

    case 'delete_hub_category': {
      const { id } = args as { id: string }
      if (!(await prisma.hubCategory.findUnique({ where: { id } }))) throw new Error(`Category not found: ${id}`)
      await prisma.hubCategory.delete({ where: { id } })
      return text(`Category ${id} deleted.`)
    }

    case 'reorder_hub_categories': {
      const { ids } = args as { ids: string[] }
      if (!Array.isArray(ids) || ids.length === 0) throw new Error('ids must be a non-empty array')
      await Promise.all(ids.map((cid, index) => prisma.hubCategory.update({ where: { id: cid }, data: { order: index } })))
      return text(`Reordered ${ids.length} category(ies).`)
    }

    /* ── Topics ──────────────────────────────────────────────────────────── */
    case 'list_hub_topics': {
      const { parentId } = args as { parentId?: string }
      const where =
        parentId === 'root' ? { parentId: null } : parentId ? { parentId } : {}
      const topics = await prisma.hubTopic.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        include: { category: CATEGORY_SELECT, tags: TAG_SELECT, ...COUNT_SELECT },
      })
      const shaped = topics.map((t) => ({
        id: t.id, title: t.title, slug: t.slug, parentId: t.parentId,
        published: t.published, order: t.order, icon: t.icon, description: t.description,
        coverImage: t.coverImage, category: t.category, tags: t.tags,
        showDate: t.showDate, displayDate: t.displayDate,
        childCount: t._count.children, itemCount: t._count.items, createdAt: t.createdAt,
      }))
      return text(shaped)
    }

    case 'get_hub_topic': {
      const { id } = args as { id: string }
      const topic = await prisma.hubTopic.findUnique({
        where: { id },
        include: {
          category: CATEGORY_SELECT,
          tags: TAG_SELECT,
          parent: { select: { id: true, title: true, slug: true } },
          items: { orderBy: [{ order: 'asc' }, { createdAt: 'desc' }], include: { category: CATEGORY_SELECT, tags: TAG_SELECT } },
          children: {
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            include: { category: CATEGORY_SELECT, tags: TAG_SELECT, ...COUNT_SELECT },
          },
        },
      })
      if (!topic) throw new Error(`Topic not found: ${id}`)
      return text(topic)
    }

    case 'create_hub_topic': {
      const { title, description, icon, coverImage, parentId, categoryId, published, showDate, displayDate, order, tagIds } =
        args as Record<string, unknown> as {
          title: string; description?: string; icon?: string; coverImage?: string; parentId?: string
          categoryId?: string; published?: boolean; showDate?: boolean; displayDate?: string; order?: number; tagIds?: string[]
        }
      if (!title?.trim() || title.trim().length > HUB_LIMITS.topicTitle) {
        throw new Error(`Title is required and must be under ${HUB_LIMITS.topicTitle} characters`)
      }
      if (description && description.length > HUB_LIMITS.description) throw new Error('Description must be under 2000 characters')
      if (icon && icon.length > HUB_LIMITS.icon) throw new Error('Icon must be under 64 characters')
      if (coverImage && !isHttpUrl(coverImage)) throw new Error('Cover image URL must be an http(s) link')
      if (parentId && !(await prisma.hubTopic.findUnique({ where: { id: parentId } }))) throw new Error(`Parent topic not found: ${parentId}`)
      await ensureCategory(categoryId)

      const slug = await uniqueTopicSlug(title)
      const topic = await prisma.hubTopic.create({
        data: {
          title: title.trim(), slug,
          description: description?.trim() || null,
          icon: icon?.trim() || null,
          coverImage: coverImage?.trim() || null,
          parentId: parentId || null,
          categoryId: categoryId || null,
          published: published === undefined ? true : Boolean(published),
          showDate: Boolean(showDate),
          displayDate: parseDateOrNull(displayDate),
          order: typeof order === 'number' ? order : 0,
          tags: { connect: tagConnect(tagIds) },
        },
        include: { category: CATEGORY_SELECT, tags: TAG_SELECT, ...COUNT_SELECT },
      })
      return text(`Topic created.\n${JSON.stringify(topic, null, 2)}`)
    }

    case 'update_hub_topic': {
      const { id, title, description, icon, coverImage, parentId, categoryId, published, showDate, displayDate, order, tagIds, regenerateSlug } =
        args as Record<string, unknown> as {
          id: string; title?: string; description?: string; icon?: string; coverImage?: string; parentId?: string | null
          categoryId?: string | null; published?: boolean; showDate?: boolean; displayDate?: string; order?: number
          tagIds?: string[]; regenerateSlug?: boolean
        }
      const existing = await prisma.hubTopic.findUnique({ where: { id } })
      if (!existing) throw new Error(`Topic not found: ${id}`)

      if (title !== undefined && (typeof title !== 'string' || !title.trim() || title.trim().length > HUB_LIMITS.topicTitle)) {
        throw new Error(`Title must be non-empty and under ${HUB_LIMITS.topicTitle} characters`)
      }
      if (typeof description === 'string' && description.length > HUB_LIMITS.description) throw new Error('Description must be under 2000 characters')
      if (icon !== undefined && icon && icon.length > HUB_LIMITS.icon) throw new Error('Icon must be under 64 characters')
      if (coverImage !== undefined && coverImage && !isHttpUrl(coverImage)) throw new Error('Cover image URL must be an http(s) link')
      if (parentId) {
        if (parentId === id || (await wouldCycle(id, parentId))) {
          throw new Error('A topic cannot be nested under itself or its own subtopic')
        }
      }
      await ensureCategory(categoryId)

      let slug = existing.slug
      if (title !== undefined && regenerateSlug) {
        const base = slugify(title) || existing.slug
        slug = base
        let n = 1
        while (slug !== existing.slug && (await prisma.hubTopic.findUnique({ where: { slug } }))) {
          n++
          slug = `${base}-${n}`
        }
      }

      const topic = await prisma.hubTopic.update({
        where: { id },
        data: {
          ...(title !== undefined && { title: title.trim() }),
          ...(slug !== existing.slug && { slug }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(icon !== undefined && { icon: icon?.trim() || null }),
          ...(coverImage !== undefined && { coverImage: coverImage?.trim() || null }),
          ...(parentId !== undefined && { parentId: parentId || null }),
          ...(categoryId !== undefined && { categoryId: categoryId || null }),
          ...(published !== undefined && { published: Boolean(published) }),
          ...(showDate !== undefined && { showDate: Boolean(showDate) }),
          ...(displayDate !== undefined && { displayDate: parseDateOrNull(displayDate) }),
          ...(order !== undefined && { order: Number(order) }),
          ...(tagIds !== undefined && { tags: { set: tagConnect(tagIds) } }),
        },
        include: { category: CATEGORY_SELECT, tags: TAG_SELECT, ...COUNT_SELECT },
      })
      return text(`Topic updated.\n${JSON.stringify(topic, null, 2)}`)
    }

    case 'delete_hub_topic': {
      const { id } = args as { id: string }
      if (!(await prisma.hubTopic.findUnique({ where: { id } }))) throw new Error(`Topic not found: ${id}`)
      await prisma.hubTopic.delete({ where: { id } })
      return text(`Topic ${id} deleted (including all subtopics and their blocks).`)
    }

    case 'reorder_hub_topics': {
      const { ids } = args as { ids: string[] }
      if (!Array.isArray(ids) || ids.length === 0) throw new Error('ids must be a non-empty array')
      await Promise.all(ids.map((tid, index) => prisma.hubTopic.update({ where: { id: tid }, data: { order: index } })))
      return text(`Reordered ${ids.length} topic(s).`)
    }

    /* ── Items (content blocks) ──────────────────────────────────────────── */
    case 'list_hub_items': {
      const { topicId } = args as { topicId: string }
      if (!(await prisma.hubTopic.findUnique({ where: { id: topicId } }))) throw new Error(`Topic not found: ${topicId}`)
      const items = await prisma.hubItem.findMany({
        where: { topicId },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        include: { category: CATEGORY_SELECT, tags: TAG_SELECT },
      })
      return text(items)
    }

    case 'get_hub_item': {
      const { id } = args as { id: string }
      const item = await prisma.hubItem.findUnique({ where: { id }, include: { category: CATEGORY_SELECT, tags: TAG_SELECT } })
      if (!item) throw new Error(`Block not found: ${id}`)
      return text(item)
    }

    case 'create_hub_item': {
      const a = args as Record<string, unknown>
      const topicId = a.topicId as string
      if (!(await prisma.hubTopic.findUnique({ where: { id: topicId } }))) throw new Error(`Topic not found: ${topicId}`)
      await ensureCategory(a.categoryId)

      const sanitized = sanitizeHubItem(
        {
          type: a.type, title: a.title, description: a.description, url: a.url,
          fileUrl: a.fileUrl, fileName: a.fileName, fileSize: a.fileSize, fileType: a.fileType,
          content: a.content, thumbnail: a.thumbnail, images: a.images,
        },
        sanitizePostHtml,
      )
      if (!sanitized.ok) throw new Error(sanitized.error)

      const item = await prisma.hubItem.create({
        data: {
          topicId,
          type: sanitized.value.type,
          title: sanitized.value.title,
          description: sanitized.value.description,
          url: sanitized.value.url,
          fileUrl: sanitized.value.fileUrl,
          fileName: sanitized.value.fileName,
          fileSize: sanitized.value.fileSize,
          fileType: sanitized.value.fileType,
          content: sanitized.value.content,
          thumbnail: sanitized.value.thumbnail,
          images: sanitized.value.images as unknown as Prisma.InputJsonValue,
          categoryId: (a.categoryId as string) || null,
          published: a.published === undefined ? true : Boolean(a.published),
          showDate: Boolean(a.showDate),
          displayDate: parseDateOrNull(a.displayDate),
          order: typeof a.order === 'number' ? a.order : 0,
          tags: { connect: tagConnect(a.tagIds) },
        },
        include: { category: CATEGORY_SELECT, tags: TAG_SELECT },
      })
      return text(`Block created.\n${JSON.stringify(item, null, 2)}`)
    }

    case 'update_hub_item': {
      const a = args as Record<string, unknown>
      const id = a.id as string
      const existing = await prisma.hubItem.findUnique({ where: { id } })
      if (!existing) throw new Error(`Block not found: ${id}`)
      await ensureCategory(a.categoryId)

      // Re-run the full per-type sanitiser whenever ANY payload field is provided —
      // merging the change over the stored row — so a type switch, a new URL, or a
      // swapped gallery is validated against that type's rules and normalised the
      // same way a create would be. (Metadata-only edits skip this; see below.)
      const touchesPayload = ['type', 'title', 'description', 'url', 'fileUrl', 'fileName', 'fileSize', 'fileType', 'content', 'thumbnail', 'images']
        .some((k) => a[k] !== undefined)

      const meta = {
        ...(a.categoryId !== undefined && { categoryId: (a.categoryId as string) || null }),
        ...(a.published !== undefined && { published: Boolean(a.published) }),
        ...(a.showDate !== undefined && { showDate: Boolean(a.showDate) }),
        ...(a.displayDate !== undefined && { displayDate: parseDateOrNull(a.displayDate) }),
        ...(a.order !== undefined && { order: Number(a.order) }),
        ...(a.tagIds !== undefined && { tags: { set: tagConnect(a.tagIds) } }),
      }

      if (touchesPayload) {
        const pick = <T>(k: string, fallback: T) => (a[k] !== undefined ? a[k] : fallback)
        const sanitized = sanitizeHubItem(
          {
            type: pick('type', existing.type),
            title: pick('title', existing.title),
            description: pick('description', existing.description),
            url: pick('url', existing.url),
            fileUrl: pick('fileUrl', existing.fileUrl),
            fileName: pick('fileName', existing.fileName),
            fileSize: pick('fileSize', existing.fileSize),
            fileType: pick('fileType', existing.fileType),
            content: pick('content', existing.content),
            thumbnail: pick('thumbnail', existing.thumbnail),
            images: pick('images', existing.images),
          },
          sanitizePostHtml,
        )
        if (!sanitized.ok) throw new Error(sanitized.error)
        const item = await prisma.hubItem.update({
          where: { id },
          data: {
            type: sanitized.value.type,
            title: sanitized.value.title,
            description: sanitized.value.description,
            url: sanitized.value.url,
            fileUrl: sanitized.value.fileUrl,
            fileName: sanitized.value.fileName,
            fileSize: sanitized.value.fileSize,
            fileType: sanitized.value.fileType,
            content: sanitized.value.content,
            thumbnail: sanitized.value.thumbnail,
            images: sanitized.value.images as unknown as Prisma.InputJsonValue,
            ...meta,
          },
          include: { category: CATEGORY_SELECT, tags: TAG_SELECT },
        })
        return text(`Block updated.\n${JSON.stringify(item, null, 2)}`)
      }

      const item = await prisma.hubItem.update({
        where: { id },
        data: meta,
        include: { category: CATEGORY_SELECT, tags: TAG_SELECT },
      })
      return text(`Block updated.\n${JSON.stringify(item, null, 2)}`)
    }

    case 'delete_hub_item': {
      const { id } = args as { id: string }
      if (!(await prisma.hubItem.findUnique({ where: { id } }))) throw new Error(`Block not found: ${id}`)
      await prisma.hubItem.delete({ where: { id } })
      return text(`Block ${id} deleted.`)
    }

    case 'reorder_hub_items': {
      const { ids } = args as { ids: string[] }
      if (!Array.isArray(ids) || ids.length === 0) throw new Error('ids must be a non-empty array')
      await Promise.all(ids.map((iid, index) => prisma.hubItem.update({ where: { id: iid }, data: { order: index } })))
      return text(`Reordered ${ids.length} block(s).`)
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
