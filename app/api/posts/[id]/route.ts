import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  const { id } = await params

  const post = await prisma.post.findUnique({ where: { id }, include: { tags: true } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!post.published && !session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(post)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { tagIds, createdAt, publishedAt, ...rest } = body

  if (rest.published === true && publishedAt === undefined) {
    rest.publishedAt = new Date()
  } else if (publishedAt !== undefined) {
    rest.publishedAt = publishedAt ? new Date(publishedAt) : null
  }
  if (createdAt !== undefined && createdAt) {
    rest.createdAt = new Date(createdAt)
  }

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...rest,
      ...(Array.isArray(tagIds)
        ? { tags: { set: tagIds.map((tid: string) => ({ id: tid })) } }
        : {}),
    },
    include: { tags: true },
  })
  return NextResponse.json(post)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.post.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
