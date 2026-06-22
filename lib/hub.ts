import { prisma } from './prisma'
import { sanitizePostHtml } from './sanitize'
import { type HubGalleryImage, type HubItemType, isHubItemType, markdownToHtml } from './hub-content'

/**
 * Server-side data layer for the Link Hub: maps Prisma rows to plain JSON shapes
 * for the client, renders Markdown / rich-text to sanitised HTML here (keeping
 * the renderer off the browser bundle), and builds the flat search index that
 * powers the public explorer's search / sort / date filter.
 */

/* ─── Serialisable shapes ────────────────────────────────────────────────── */

export interface HubTagRef {
  id: string
  name: string
  slug: string
}

export interface HubCategoryRef {
  id: string
  name: string
  slug: string
  color: string | null
}

export interface HubItemData {
  id: string
  type: HubItemType
  title: string
  description: string | null
  url: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  fileType: string | null
  /** Raw text body for `text` blocks (rendered as escaped plain text). */
  content: string | null
  /** Pre-sanitised HTML for `markdown` / `richtext` blocks. */
  contentHtml: string | null
  thumbnail: string | null
  /** Gallery photos for an `image` block (1+ entries); always `[]` for other types. */
  images: HubGalleryImage[]
  category: HubCategoryRef | null
  tags: HubTagRef[]
  /** Visibility — always true on public payloads (they exclude drafts); used by the admin editor. */
  published: boolean
  /** ISO date shown publicly, or null when hidden. */
  date: string | null
  /** ISO date always present (displayDate ?? createdAt) — drives sort + filter. */
  sortDate: string
}

export interface HubTopicSummary {
  id: string
  title: string
  slug: string
  description: string | null
  icon: string | null
  coverImage: string | null
  category: HubCategoryRef | null
  tags: HubTagRef[]
  date: string | null
  sortDate: string
  childCount: number
  itemCount: number
}

export interface HubCrumb {
  title: string
  slug: string
}

export interface HubTopicDetail extends HubTopicSummary {
  /** Ancestors from root → immediate parent (excludes the topic itself). */
  breadcrumb: HubCrumb[]
  children: HubTopicSummary[]
  items: HubItemData[]
}

/** One row in the flat search index — a topic or a content block. */
export interface HubEntry {
  kind: 'topic' | 'item'
  id: string
  title: string
  description: string | null
  /** Link target: the topic page (topics) or the owning topic page (items). */
  href: string
  /** Content-block type, for items only. */
  itemType: HubItemType | null
  category: HubCategoryRef | null
  tags: HubTagRef[]
  date: string | null
  sortDate: string
  /** Breadcrumb of the topic (or owning topic) for context in results. */
  path: HubCrumb[]
}

export interface HubLandingData {
  topics: HubTopicSummary[]
  entries: HubEntry[]
  categories: HubCategoryRef[]
}

/* ─── Row → shape mappers ────────────────────────────────────────────────── */

type CategoryRow = { id: string; name: string; slug: string; color: string | null } | null
type TagRow = { id: string; name: string; slug: string }

function toCategoryRef(cat: CategoryRow): HubCategoryRef | null {
  return cat ? { id: cat.id, name: cat.name, slug: cat.slug, color: cat.color } : null
}

function toTagRefs(tags: TagRow[]): HubTagRef[] {
  return tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug }))
}

type ItemRow = {
  id: string
  type: string
  title: string
  description: string | null
  url: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  fileType: string | null
  content: string | null
  thumbnail: string | null
  images: unknown
  published: boolean
  showDate: boolean
  displayDate: Date | null
  createdAt: Date
  category: CategoryRow
  tags: TagRow[]
}

function toGalleryImage(v: unknown): HubGalleryImage | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (typeof o.url !== 'string') return null
  return {
    url: o.url,
    fileName: typeof o.fileName === 'string' ? o.fileName : null,
    fileSize: typeof o.fileSize === 'number' ? o.fileSize : null,
    fileType: typeof o.fileType === 'string' ? o.fileType : null,
  }
}

/** Reads the `images` gallery column, falling back to a 1-photo gallery built
 * from the legacy fileUrl/url columns for rows saved before that column existed. */
function toItemImages(item: ItemRow): HubGalleryImage[] {
  if (Array.isArray(item.images)) {
    const parsed = item.images.map(toGalleryImage).filter((v): v is HubGalleryImage => v !== null)
    if (parsed.length > 0) return parsed
  }
  const fallback = item.fileUrl ?? item.url
  return fallback
    ? [{ url: fallback, fileName: item.fileName, fileSize: item.fileSize, fileType: item.fileType }]
    : []
}

function toItemData(item: ItemRow): HubItemData {
  const type: HubItemType = isHubItemType(item.type) ? item.type : 'text'

  let content: string | null = null
  let contentHtml: string | null = null
  if (type === 'text') {
    content = item.content
  } else if (type === 'markdown') {
    contentHtml = item.content ? sanitizePostHtml(markdownToHtml(item.content)) : null
  } else if (type === 'richtext') {
    // Stored already-sanitised on write; sanitise again defensively on read.
    contentHtml = item.content ? sanitizePostHtml(item.content) : null
  }

  const sortDate = (item.displayDate ?? item.createdAt).toISOString()
  return {
    id: item.id,
    type,
    title: item.title,
    description: item.description,
    url: item.url,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    fileType: item.fileType,
    content,
    contentHtml,
    thumbnail: item.thumbnail,
    images: type === 'image' ? toItemImages(item) : [],
    category: toCategoryRef(item.category),
    tags: toTagRefs(item.tags),
    published: item.published,
    date: item.showDate ? sortDate : null,
    sortDate,
  }
}

type TopicRow = {
  id: string
  title: string
  slug: string
  description: string | null
  icon: string | null
  coverImage: string | null
  showDate: boolean
  displayDate: Date | null
  createdAt: Date
  category: CategoryRow
  tags: TagRow[]
  _count?: { children: number; items: number }
}

function toTopicSummary(topic: TopicRow, childCount: number, itemCount: number): HubTopicSummary {
  const sortDate = (topic.displayDate ?? topic.createdAt).toISOString()
  return {
    id: topic.id,
    title: topic.title,
    slug: topic.slug,
    description: topic.description,
    icon: topic.icon,
    coverImage: topic.coverImage,
    category: toCategoryRef(topic.category),
    tags: toTagRefs(topic.tags),
    date: topic.showDate ? sortDate : null,
    sortDate,
    childCount,
    itemCount,
  }
}

const CATEGORY_SELECT = { select: { id: true, name: true, slug: true, color: true } } as const
const TAG_SELECT = { select: { id: true, name: true, slug: true } } as const

/* ─── Public reads ───────────────────────────────────────────────────────── */

/**
 * Everything the public /hub explorer needs in one pass: top-level topic cards,
 * a flat search index over every published topic + block (with breadcrumb), and
 * the category facets. Visibility cascades under unpublished ancestors.
 */
export async function getHubLanding(): Promise<HubLandingData> {
  const [topics, items, categories] = await Promise.all([
    prisma.hubTopic.findMany({
      where: { published: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: { category: CATEGORY_SELECT, tags: TAG_SELECT },
    }),
    prisma.hubItem.findMany({
      where: { published: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: { category: CATEGORY_SELECT, tags: TAG_SELECT },
    }),
    prisma.hubCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
  ])

  // Index topics for visibility-cascade + breadcrumb computation.
  const byId = new Map(topics.map((t) => [t.id, t]))
  const parentOf = new Map<string, string | null>(topics.map((t) => [t.id, t.parentId]))

  // Visible only when the node and every ancestor is published. `topics` already
  // excludes drafts, so a missing ancestor means the chain is hidden → drop it.
  function isVisible(id: string): boolean {
    let cur: string | null | undefined = id
    const seen = new Set<string>()
    while (cur) {
      if (seen.has(cur)) return false // cycle guard
      seen.add(cur)
      if (!byId.has(cur)) return false
      cur = parentOf.get(cur) ?? null
    }
    return true
  }

  function pathOf(id: string): HubCrumb[] {
    const chain: HubCrumb[] = []
    let cur: string | null | undefined = parentOf.get(id) ?? null
    const seen = new Set<string>()
    while (cur && !seen.has(cur)) {
      const t = byId.get(cur)
      if (!t) break
      seen.add(cur)
      chain.unshift({ title: t.title, slug: t.slug })
      cur = parentOf.get(cur) ?? null
    }
    return chain
  }

  const visibleTopics = topics.filter((t) => isVisible(t.id))
  const visibleItems = items.filter((it) => byId.has(it.topicId) && isVisible(it.topicId))

  // Child + item counts per topic (only counting visible descendants/blocks).
  const childCount = new Map<string, number>()
  for (const t of visibleTopics) {
    if (t.parentId) childCount.set(t.parentId, (childCount.get(t.parentId) ?? 0) + 1)
  }
  const itemCount = new Map<string, number>()
  for (const it of visibleItems) {
    itemCount.set(it.topicId, (itemCount.get(it.topicId) ?? 0) + 1)
  }

  const topLevel = visibleTopics
    .filter((t) => !t.parentId)
    .map((t) => toTopicSummary(t, childCount.get(t.id) ?? 0, itemCount.get(t.id) ?? 0))

  const entries: HubEntry[] = [
    ...visibleTopics.map((t): HubEntry => {
      const summary = toTopicSummary(t, childCount.get(t.id) ?? 0, itemCount.get(t.id) ?? 0)
      return {
        kind: 'topic',
        id: t.id,
        title: t.title,
        description: t.description,
        href: `/hub/${t.slug}`,
        itemType: null,
        category: summary.category,
        tags: summary.tags,
        date: summary.date,
        sortDate: summary.sortDate,
        path: pathOf(t.id),
      }
    }),
    ...visibleItems.flatMap((it): HubEntry[] => {
      const topic = byId.get(it.topicId)
      if (!topic) return [] // unreachable: visibleItems is filtered to known topics
      const data = toItemData(it)
      return [{
        kind: 'item',
        id: it.id,
        title: it.title,
        description: it.description,
        href: `/hub/${topic.slug}#item-${it.id}`,
        itemType: data.type,
        category: data.category,
        tags: data.tags,
        date: data.date,
        sortDate: data.sortDate,
        path: [...pathOf(it.topicId), { title: topic.title, slug: topic.slug }],
      }]
    }),
  ]

  return {
    topics: topLevel,
    entries,
    categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, color: c.color })),
  }
}

/** Full detail for one topic page (blocks, subtopics, ancestor breadcrumb); null when the slug is unknown or the topic / any ancestor is unpublished. */
export async function getHubTopicDetail(slug: string): Promise<HubTopicDetail | null> {
  const topic = await prisma.hubTopic.findUnique({
    where: { slug },
    include: {
      category: CATEGORY_SELECT,
      tags: TAG_SELECT,
      items: {
        where: { published: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        include: { category: CATEGORY_SELECT, tags: TAG_SELECT },
      },
      children: {
        where: { published: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        include: {
          category: CATEGORY_SELECT,
          tags: TAG_SELECT,
          _count: { select: { children: true, items: true } },
        },
      },
    },
  })
  if (!topic || !topic.published) return null

  // Walk + verify the ancestor chain is fully published; build the breadcrumb.
  const breadcrumb: HubCrumb[] = []
  let parentId = topic.parentId
  const seen = new Set<string>([topic.id])
  while (parentId) {
    if (seen.has(parentId)) break
    seen.add(parentId)
    const parent = await prisma.hubTopic.findUnique({
      where: { id: parentId },
      select: { id: true, title: true, slug: true, published: true, parentId: true },
    })
    if (!parent || !parent.published) return null
    breadcrumb.unshift({ title: parent.title, slug: parent.slug })
    parentId = parent.parentId
  }

  const children = topic.children.map((c) =>
    toTopicSummary(c, c._count?.children ?? 0, c._count?.items ?? 0),
  )
  const items = topic.items.map(toItemData)

  return {
    ...toTopicSummary(topic, children.length, items.length),
    breadcrumb,
    children,
    items,
  }
}

/** All hub categories (admin facets), in display order. */
export async function getHubCategories(): Promise<HubCategoryRef[]> {
  const rows = await prisma.hubCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] })
  return rows.map((c) => ({ id: c.id, name: c.name, slug: c.slug, color: c.color }))
}

/** Published-topic slugs for static-ish helpers (sitemap, etc.). */
export async function getPublishedHubTopicSlugs(): Promise<string[]> {
  const rows = await prisma.hubTopic.findMany({ where: { published: true }, select: { slug: true } })
  return rows.map((r) => r.slug)
}

/** True when at least one published topic exists (gates the nav link + section). */
export async function hasPublishedHub(): Promise<boolean> {
  const count = await prisma.hubTopic.count({ where: { published: true } })
  return count > 0
}

/* ─── Admin reads ────────────────────────────────────────────────────────── */

export interface HubAdminTopicNode extends HubTopicSummary {
  published: boolean
  parentId: string | null
  depth: number
  children: HubAdminTopicNode[]
}

/** The full topic tree (incl. unpublished) for the admin list, depth-ordered. */
export async function getHubAdminTree(): Promise<HubAdminTopicNode[]> {
  const topics = await prisma.hubTopic.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    include: {
      category: CATEGORY_SELECT,
      tags: TAG_SELECT,
      _count: { select: { children: true, items: true } },
    },
  })

  const nodeById = new Map<string, HubAdminTopicNode>()
  for (const t of topics) {
    nodeById.set(t.id, {
      ...toTopicSummary(t, t._count?.children ?? 0, t._count?.items ?? 0),
      published: t.published,
      parentId: t.parentId,
      depth: 0,
      children: [],
    })
  }

  const roots: HubAdminTopicNode[] = []
  for (const t of topics) {
    const node = nodeById.get(t.id)
    if (!node) continue
    const parent = t.parentId ? nodeById.get(t.parentId) : undefined
    if (parent) {
      node.depth = parent.depth + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

export interface HubTopicEditData {
  id: string
  title: string
  slug: string
  description: string | null
  icon: string | null
  coverImage: string | null
  published: boolean
  showDate: boolean
  displayDate: string | null
  order: number
  parentId: string | null
  categoryId: string | null
  tags: HubTagRef[]
  items: HubItemData[]
}

/** Full editable state for one topic (admin edit page). */
export async function getHubTopicForEdit(id: string): Promise<HubTopicEditData | null> {
  const topic = await prisma.hubTopic.findUnique({
    where: { id },
    include: {
      tags: TAG_SELECT,
      items: {
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        include: { category: CATEGORY_SELECT, tags: TAG_SELECT },
      },
    },
  })
  if (!topic) return null
  return {
    id: topic.id,
    title: topic.title,
    slug: topic.slug,
    description: topic.description,
    icon: topic.icon,
    coverImage: topic.coverImage,
    published: topic.published,
    showDate: topic.showDate,
    displayDate: topic.displayDate ? topic.displayDate.toISOString() : null,
    order: topic.order,
    parentId: topic.parentId,
    categoryId: topic.categoryId,
    tags: toTagRefs(topic.tags),
    items: topic.items.map(toItemData),
  }
}

/** Flat list of topics for the admin "parent" picker (id, title, depth). */
export async function getHubTopicOptions(): Promise<{ id: string; title: string; depth: number; parentId: string | null }[]> {
  const tree = await getHubAdminTree()
  const out: { id: string; title: string; depth: number; parentId: string | null }[] = []
  const walk = (nodes: HubAdminTopicNode[]) => {
    for (const n of nodes) {
      out.push({ id: n.id, title: n.title, depth: n.depth, parentId: n.parentId })
      walk(n.children)
    }
  }
  walk(tree)
  return out
}
