import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await auth()
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === 'true'

  const where = session || all ? {} : { published: true }
  const posts = await prisma.post.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    select: { id: true, title: true, slug: true, excerpt: true, published: true, publishedAt: true, createdAt: true },
  })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, content, excerpt, published } = body

  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }

  const slug = slugify(title)
  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content,
      excerpt: excerpt ?? null,
      published: Boolean(published),
      publishedAt: published ? new Date() : null,
    },
  })
  return NextResponse.json(post, { status: 201 })
}
