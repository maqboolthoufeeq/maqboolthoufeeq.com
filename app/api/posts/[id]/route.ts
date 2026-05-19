import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  const { id } = await params

  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!post.published && !session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(post)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  if (body.published === true) {
    body.publishedAt = body.publishedAt ?? new Date()
  }

  const post = await prisma.post.update({ where: { id }, data: body })
  return NextResponse.json(post)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.post.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
