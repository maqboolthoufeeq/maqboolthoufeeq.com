import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  isPlatform, parseEmbedId, detectPlatform, isHttpUrl, mediaLengthError,
  sanitizeMediaLinks, sanitizeMediaAttachments,
} from '@/lib/social'
import { parseDateOrNull } from '@/lib/utils'

export async function GET(req: NextRequest) {
  // Drafts are only visible to an authenticated admin; the public sees published.
  const session = await auth()
  const { searchParams } = new URL(req.url)
  const platform = searchParams.get('platform')
  const categoryId = searchParams.get('category')

  const items = await prisma.mediaItem.findMany({
    where: {
      ...(session ? {} : { published: true }),
      ...(isPlatform(platform) ? { platform } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    include: { category: { select: { id: true, name: true, slug: true } } },
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    title,
    description,
    sourceUrl,
    thumbnailUrl,
    previewVideoUrl,
    links,
    attachments,
    featured,
    published,
    showDate,
    displayDate,
    order,
    categoryId,
  } = body
  let { platform } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  if (!sourceUrl?.trim()) {
    return NextResponse.json({ error: 'A reel or video URL is required' }, { status: 400 })
  }

  const lengthError = mediaLengthError({ title, description, sourceUrl, thumbnailUrl, previewVideoUrl })
  if (lengthError) return NextResponse.json({ error: lengthError }, { status: 400 })
  if (!isHttpUrl(thumbnailUrl)) {
    return NextResponse.json({ error: 'Thumbnail URL must be an http(s) link' }, { status: 400 })
  }
  if (!isHttpUrl(previewVideoUrl)) {
    return NextResponse.json({ error: 'Preview clip URL must be an http(s) link' }, { status: 400 })
  }

  // Trust the URL over the declared platform: derive/repair it server-side.
  if (!isPlatform(platform)) platform = detectPlatform(sourceUrl)
  if (!isPlatform(platform)) {
    return NextResponse.json({ error: 'platform must be "instagram" or "youtube"' }, { status: 400 })
  }

  const embedId = parseEmbedId(platform, sourceUrl)
  if (!embedId) {
    return NextResponse.json(
      { error: `Could not read a ${platform === 'youtube' ? 'YouTube video' : 'Instagram reel'} id from that URL` },
      { status: 400 },
    )
  }

  const item = await prisma.mediaItem.create({
    data: {
      platform,
      title: title.trim(),
      description: description?.trim() || null,
      sourceUrl: sourceUrl.trim(),
      embedId,
      thumbnailUrl: thumbnailUrl?.trim() || null,
      previewVideoUrl: previewVideoUrl?.trim() || null,
      links: sanitizeMediaLinks(links) as unknown as Prisma.InputJsonValue,
      attachments: sanitizeMediaAttachments(attachments) as unknown as Prisma.InputJsonValue,
      featured: Boolean(featured),
      published: published === undefined ? true : Boolean(published),
      showDate: Boolean(showDate),
      displayDate: parseDateOrNull(displayDate),
      order: typeof order === 'number' ? order : 0,
      categoryId: categoryId || null,
    },
    include: { category: { select: { id: true, name: true, slug: true } } },
  })
  return NextResponse.json(item, { status: 201 })
}
