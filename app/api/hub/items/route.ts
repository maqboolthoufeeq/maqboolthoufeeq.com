import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizePostHtml } from '@/lib/sanitize'
import { sanitizeHubItem } from '@/lib/hub-content'
import { parseDateOrNull } from '@/lib/utils'

const CATEGORY_SELECT = { select: { id: true, name: true, slug: true, color: true } } as const
const TAG_SELECT = { select: { id: true, name: true, slug: true } } as const

/** Tags arrive as existing tag ids (TagSelector persists new ones first). */
function tagConnect(tags: unknown) {
  return (Array.isArray(tags) ? tags : [])
    .filter((id: unknown): id is string => typeof id === 'string')
    .map((id) => ({ id }))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    topicId,
    type,
    title,
    description,
    url,
    fileUrl,
    fileName,
    fileSize,
    fileType,
    content,
    thumbnail,
    images,
    categoryId,
    published,
    showDate,
    displayDate,
    order,
    tags,
  } = body

  // Validate topicId exists
  const topic = await prisma.hubTopic.findUnique({ where: { id: topicId } })
  if (!topic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
  }

  // Sanitize the entire item
  const sanitized = sanitizeHubItem(
    { type, title, description, url, fileUrl, fileName, fileSize, fileType, content, thumbnail, images },
    sanitizePostHtml,
  )

  if (!sanitized.ok) {
    return NextResponse.json({ error: sanitized.error }, { status: 400 })
  }

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
    },
  })

  return NextResponse.json(item, { status: 201 })
}
