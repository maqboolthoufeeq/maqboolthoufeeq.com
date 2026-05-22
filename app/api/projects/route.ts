import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { order: 'asc' },
    include: { tags: { select: { id: true, name: true, slug: true } } },
  })
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, tech, liveUrl, repoUrl, imageUrl, images, order, featured, tagIds } = body

  if (!title || !description) {
    return NextResponse.json({ error: 'title and description are required' }, { status: 400 })
  }

  const project = await prisma.project.create({
    data: {
      title,
      description,
      tech: Array.isArray(tech) ? tech : [],
      liveUrl: liveUrl ?? null,
      repoUrl: repoUrl ?? null,
      imageUrl: imageUrl ?? null,
      images: Array.isArray(images) ? images : [],
      order: typeof order === 'number' ? order : 0,
      featured: Boolean(featured),
      ...(Array.isArray(tagIds) && tagIds.length > 0
        ? { tags: { connect: tagIds.map((id: string) => ({ id })) } }
        : {}),
    },
    include: { tags: true },
  })
  return NextResponse.json(project, { status: 201 })
}
