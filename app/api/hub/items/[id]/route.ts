import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizePostHtml } from '@/lib/sanitize'
import { sanitizeHubItem } from '@/lib/hub-content'
import { parseDateOrNull } from '@/lib/utils'

type Ctx = { params: Promise<{ id: string }> }

const CATEGORY_SELECT = { select: { id: true, name: true, slug: true, color: true } } as const
const TAG_SELECT = { select: { id: true, name: true, slug: true } } as const

function tagConnect(tags: unknown) {
  return (Array.isArray(tags) ? tags : [])
    .filter((id: unknown): id is string => typeof id === 'string')
    .map((id) => ({ id }))
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.hubItem.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const {
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

  // If type, title, or content fields are being updated, re-validate via sanitizeHubItem
  if (type !== undefined || title !== undefined || content !== undefined) {
    const sanitized = sanitizeHubItem(
      {
        type: type !== undefined ? type : existing.type,
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        url: url !== undefined ? url : existing.url,
        fileUrl: fileUrl !== undefined ? fileUrl : existing.fileUrl,
        fileName: fileName !== undefined ? fileName : existing.fileName,
        fileSize: fileSize !== undefined ? fileSize : existing.fileSize,
        fileType: fileType !== undefined ? fileType : existing.fileType,
        content: content !== undefined ? content : existing.content,
        thumbnail: thumbnail !== undefined ? thumbnail : existing.thumbnail,
        images: images !== undefined ? images : existing.images,
      },
      sanitizePostHtml,
    )

    if (!sanitized.ok) {
      return NextResponse.json({ error: sanitized.error }, { status: 400 })
    }

    // Apply sanitized values
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
      },
    })
    return NextResponse.json(item)
  }

  // Partial update for non-content fields
  const item = await prisma.hubItem.update({
    where: { id },
    data: {
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
    },
  })

  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.hubItem.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.hubItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
