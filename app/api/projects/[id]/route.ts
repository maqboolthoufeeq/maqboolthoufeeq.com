import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const project = await prisma.project.findUnique({ where: { id }, include: { tags: true } })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { title, description, tech, liveUrl, repoUrl, imageUrl, images, order, featured, tagIds } = body

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(tech !== undefined && { tech: Array.isArray(tech) ? tech : [] }),
      ...(liveUrl !== undefined && { liveUrl: liveUrl ?? null }),
      ...(repoUrl !== undefined && { repoUrl: repoUrl ?? null }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl ?? null }),
      ...(images !== undefined && { images: Array.isArray(images) ? images : [] }),
      ...(order !== undefined && { order }),
      ...(featured !== undefined && { featured: Boolean(featured) }),
      ...(Array.isArray(tagIds) && { tags: { set: tagIds.map((tid: string) => ({ id: tid })) } }),
    },
    include: { tags: true },
  })
  return NextResponse.json(project)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.project.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
