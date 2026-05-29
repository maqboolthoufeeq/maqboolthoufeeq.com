import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ slug: string }> }

// Returns the current zap count for a published post.
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params
  const post = await prisma.post.findFirst({
    where: { slug, published: true },
    select: { zaps: true },
  })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ zaps: post.zaps })
}

// Records a "this was helpful" zap and returns the updated count.
// Abuse is kept in check client-side (one zap per browser via localStorage);
// this endpoint just performs an atomic increment.
export async function POST(_req: Request, { params }: Params) {
  const { slug } = await params

  const existing = await prisma.post.findFirst({
    where: { slug, published: true },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.post.update({
    where: { id: existing.id },
    data: { zaps: { increment: 1 } },
    select: { zaps: true },
  })
  return NextResponse.json({ zaps: updated.zaps })
}
