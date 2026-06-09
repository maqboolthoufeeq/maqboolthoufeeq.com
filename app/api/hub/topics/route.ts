import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isHttpUrl } from '@/lib/social'
import { slugify, parseDateOrNull } from '@/lib/utils'
import { HUB_LIMITS } from '@/lib/hub-content'

const CATEGORY_SELECT = { select: { id: true, name: true, slug: true, color: true } } as const
const TAG_SELECT = { select: { id: true, name: true, slug: true } } as const

/** Tags arrive as an array of existing tag ids (TagSelector persists new tags
 *  via /api/tags first), so connect by id — never trust arbitrary names. */
function tagConnect(tags: unknown) {
  return (Array.isArray(tags) ? tags : [])
    .filter((id: unknown): id is string => typeof id === 'string')
    .map((id) => ({ id }))
}

async function uniqueTopicSlug(base: string): Promise<string> {
  let slug = slugify(base) || 'topic'
  let n = 1
  while (await prisma.hubTopic.findUnique({ where: { slug } })) {
    n++
    slug = `${slugify(base) || 'topic'}-${n}`
  }
  return slug
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const { searchParams } = new URL(req.url)
  const parent = searchParams.get('parent')

  const where: Prisma.HubTopicWhereInput = {
    ...(session ? {} : { published: true }),
    ...(parent === 'root'
      ? { parentId: null }
      : parent
        ? { parentId: parent }
        : {}),
  }

  const topics = await prisma.hubTopic.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    include: {
      category: CATEGORY_SELECT,
      tags: TAG_SELECT,
      _count: { select: { children: true, items: true } },
    },
  })

  return NextResponse.json(topics)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  } = body

  if (!title?.trim() || title.trim().length > HUB_LIMITS.topicTitle) {
    return NextResponse.json({ error: 'Title is required and must be under 160 characters' }, { status: 400 })
  }

  if (description && description.length > HUB_LIMITS.description) {
    return NextResponse.json({ error: 'Description must be under 2000 characters' }, { status: 400 })
  }

  if (icon && icon.length > HUB_LIMITS.icon) {
    return NextResponse.json({ error: 'Icon must be under 64 characters' }, { status: 400 })
  }

  if (coverImage && !isHttpUrl(coverImage)) {
    return NextResponse.json({ error: 'Cover image URL must be an http(s) link' }, { status: 400 })
  }

  const slug = await uniqueTopicSlug(title)

  const topic = await prisma.hubTopic.create({
    data: {
      title: title.trim(),
      slug,
      description: description?.trim() || null,
      icon: icon?.trim() || null,
      coverImage: coverImage?.trim() || null,
      parentId: parentId || null,
      categoryId: categoryId || null,
      published: published === undefined ? true : Boolean(published),
      showDate: Boolean(showDate),
      displayDate: parseDateOrNull(displayDate),
      order: typeof order === 'number' ? order : 0,
      tags: { connect: tagConnect(tags) },
    },
    include: {
      category: CATEGORY_SELECT,
      tags: TAG_SELECT,
      _count: { select: { children: true, items: true } },
    },
  })

  return NextResponse.json(topic, { status: 201 })
}
