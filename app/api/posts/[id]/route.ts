import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  const authed = await isAuthenticated(req)
  const { id } = await params

  const post = await prisma.post.findUnique({ where: { id }, include: { tags: true } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!post.published && !authed) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(post)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await isAuthenticated(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  try {
    if (Array.isArray(tagIds)) {
      await prisma.post.update({ where: { id }, data: { tags: { set: [] } } })
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...rest,
        ...(Array.isArray(tagIds)
          ? { tags: { connect: tagIds.map((tid: string) => ({ id: tid })) } }
          : {}),
      },
      include: { tags: true },
    })
    return NextResponse.json(post)
  } catch (err) {
    console.error('PATCH /api/posts/[id]', err)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!(await isAuthenticated(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.post.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
