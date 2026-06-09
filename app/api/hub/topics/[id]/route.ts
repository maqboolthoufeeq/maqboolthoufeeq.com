import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isHttpUrl } from '@/lib/social'
import { slugify, parseDateOrNull } from '@/lib/utils'
import { HUB_LIMITS } from '@/lib/hub-content'

type Ctx = { params: Promise<{ id: string }> }

const CATEGORY_SELECT = { select: { id: true, name: true, slug: true, color: true } } as const
const TAG_SELECT = { select: { id: true, name: true, slug: true } } as const

function tagConnect(tags: unknown) {
  return (Array.isArray(tags) ? tags : [])
    .filter((id: unknown): id is string => typeof id === 'string')
    .map((id) => ({ id }))
}

/** True when making `candidateParent` the parent of `id` would form a cycle
 *  (candidate is the node itself or one of its descendants). */
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

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const topic = await prisma.hubTopic.findUnique({
    where: { id },
    include: {
      category: CATEGORY_SELECT,
      tags: TAG_SELECT,
      items: {
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        include: {
          category: CATEGORY_SELECT,
          tags: TAG_SELECT,
        },
      },
    },
  })

  if (!topic) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(topic)
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.hubTopic.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const {
    title,
    description,
    icon,
    coverImage,
    parentId,
    categoryId,
    published,
    showDate,
    displayDate,
    order,
    tags,
    regenerateSlug,
  } = body

  if (title !== undefined && (!title.trim() || title.trim().length > HUB_LIMITS.topicTitle)) {
    return NextResponse.json({ error: 'Title must be non-empty and under 160 characters' }, { status: 400 })
  }

  if (description !== undefined && description.length > HUB_LIMITS.description) {
    return NextResponse.json({ error: 'Description must be under 2000 characters' }, { status: 400 })
  }

  if (icon !== undefined && icon && icon.length > HUB_LIMITS.icon) {
    return NextResponse.json({ error: 'Icon must be under 64 characters' }, { status: 400 })
  }

  if (coverImage !== undefined && coverImage && !isHttpUrl(coverImage)) {
    return NextResponse.json({ error: 'Cover image URL must be an http(s) link' }, { status: 400 })
  }

  // Prevent the tree from being made cyclic (a topic can't be its own ancestor).
  if (parentId) {
    if (parentId === id || (await wouldCycle(id, parentId))) {
      return NextResponse.json({ error: 'A topic cannot be nested under itself or its own subtopic' }, { status: 400 })
    }
  }

  // Generate a new slug if title changes and regenerateSlug is true, else keep existing
  let slug = existing.slug
  if (title !== undefined && regenerateSlug) {
    slug = slugify(title) || existing.slug
    // Ensure uniqueness
    let n = 1
    const base = slug
    while (
      slug !== existing.slug &&
      (await prisma.hubTopic.findUnique({ where: { slug } }))
    ) {
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
      ...(tags !== undefined && {
        tags: { set: tagConnect(tags) },
      }),
    },
    include: {
      category: CATEGORY_SELECT,
      tags: TAG_SELECT,
      _count: { select: { children: true, items: true } },
    },
  })

  return NextResponse.json(topic)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.hubTopic.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.hubTopic.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
