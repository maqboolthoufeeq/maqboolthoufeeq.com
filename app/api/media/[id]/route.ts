import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isPlatform, parseEmbedId, isHttpUrl, mediaLengthError } from '@/lib/social'
import { parseDateOrNull } from '@/lib/utils'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const item = await prisma.mediaItem.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true, slug: true } } },
  })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.mediaItem.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const {
    title,
    description,
    sourceUrl,
    platform,
    thumbnailUrl,
    previewVideoUrl,
    featured,
    published,
    showDate,
    displayDate,
    order,
    categoryId,
  } = body

  if (sourceUrl !== undefined && !String(sourceUrl).trim()) {
    return NextResponse.json({ error: 'A reel or video URL is required' }, { status: 400 })
  }
  const lengthError = mediaLengthError({ title, description, sourceUrl, thumbnailUrl, previewVideoUrl })
  if (lengthError) return NextResponse.json({ error: lengthError }, { status: 400 })
  if (thumbnailUrl !== undefined && !isHttpUrl(thumbnailUrl)) {
    return NextResponse.json({ error: 'Thumbnail URL must be an http(s) link' }, { status: 400 })
  }
  if (previewVideoUrl !== undefined && !isHttpUrl(previewVideoUrl)) {
    return NextResponse.json({ error: 'Preview clip URL must be an http(s) link' }, { status: 400 })
  }

  // Resolve the effective platform + URL so we can re-derive the embed id when
  // either changes (e.g. admin pasted a new link).
  const nextPlatform = isPlatform(platform) ? platform : (existing.platform as 'instagram' | 'youtube')
  let embedId: string | undefined
  if (sourceUrl !== undefined || platform !== undefined) {
    const url = sourceUrl !== undefined ? sourceUrl : existing.sourceUrl
    const parsed = parseEmbedId(nextPlatform, url)
    if (!parsed) {
      return NextResponse.json(
        { error: `Could not read a ${nextPlatform === 'youtube' ? 'YouTube video' : 'Instagram reel'} id from that URL` },
        { status: 400 },
      )
    }
    embedId = parsed
  }

  const item = await prisma.mediaItem.update({
    where: { id },
    data: {
      ...(platform !== undefined && isPlatform(platform) && { platform }),
      ...(title !== undefined && { title: String(title).trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(sourceUrl !== undefined && { sourceUrl: String(sourceUrl).trim() }),
      ...(embedId !== undefined && { embedId }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl?.trim() || null }),
      ...(previewVideoUrl !== undefined && { previewVideoUrl: previewVideoUrl?.trim() || null }),
      ...(featured !== undefined && { featured: Boolean(featured) }),
      ...(published !== undefined && { published: Boolean(published) }),
      ...(showDate !== undefined && { showDate: Boolean(showDate) }),
      ...(displayDate !== undefined && { displayDate: parseDateOrNull(displayDate) }),
      ...(order !== undefined && { order: Number(order) }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
    },
    include: { category: { select: { id: true, name: true, slug: true } } },
  })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.mediaItem.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
