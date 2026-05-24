import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAuthenticated } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await auth()
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === 'true'

  const authed = session || (await isAuthenticated(req))
  const where = authed || all ? {} : { published: true }
  const posts = await prisma.post.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true, title: true, slug: true, excerpt: true, coverImage: true,
      published: true, publishedAt: true, createdAt: true,
      tags: { select: { id: true, name: true, slug: true } },
    },
  })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, content, excerpt, published, coverImage, createdAt, publishedAt, tagIds } = body

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
      coverImage: coverImage ?? null,
      published: Boolean(published),
      publishedAt: publishedAt ? new Date(publishedAt) : published ? new Date() : null,
      ...(createdAt ? { createdAt: new Date(createdAt) } : {}),
      ...(Array.isArray(tagIds) && tagIds.length > 0
        ? { tags: { connect: tagIds.map((id: string) => ({ id })) } }
        : {}),
    },
    include: { tags: true },
  })
  return NextResponse.json(post, { status: 201 })
}
