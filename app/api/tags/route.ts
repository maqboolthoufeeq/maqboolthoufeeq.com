import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify, isUniqueConstraintError } from '@/lib/utils'

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { posts: true, projects: true } } },
  })
  return NextResponse.json(tags)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (!trimmed) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  // Reuse an existing tag with the same name (case-insensitive) instead of
  // failing on the unique constraint — "create" from the tag picker should be
  // idempotent so re-typing an existing tag just selects it.
  const existing = await prisma.tag.findFirst({ where: { name: { equals: trimmed, mode: 'insensitive' } } })
  if (existing) return NextResponse.json(existing)

  // Generate a slug that doesn't collide with a different tag (e.g. "C#" / "C++").
  const base = slugify(trimmed) || 'tag'
  let slug = base
  for (let n = 2; await prisma.tag.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`

  try {
    const tag = await prisma.tag.create({ data: { name: trimmed, slug } })
    return NextResponse.json(tag, { status: 201 })
  } catch (err) {
    // Lost a create race — return the now-existing tag rather than 500.
    if (isUniqueConstraintError(err)) {
      const t = await prisma.tag.findFirst({ where: { name: { equals: trimmed, mode: 'insensitive' } } })
      if (t) return NextResponse.json(t)
    }
    throw err
  }
}
