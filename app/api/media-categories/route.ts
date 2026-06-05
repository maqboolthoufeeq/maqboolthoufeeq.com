import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify, isUniqueConstraintError } from '@/lib/utils'

export async function GET() {
  const categories = await prisma.mediaCategory.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { items: true } } },
  })
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (name.trim().length > 80) return NextResponse.json({ error: 'name is too long' }, { status: 400 })

  const base = slugify(name.trim()) || 'topic'
  const last = await prisma.mediaCategory.findFirst({ orderBy: { order: 'desc' } })
  const order = (last?.order ?? -1) + 1

  // Optimistic insert with retry: the DB unique constraint is the source of
  // truth, so concurrent creates can't both win the same slug.
  for (let i = 1; i <= 50; i++) {
    const slug = i === 1 ? base : `${base}-${i}`
    try {
      const category = await prisma.mediaCategory.create({
        data: { name: name.trim(), slug, order },
      })
      return NextResponse.json(category, { status: 201 })
    } catch (err) {
      if (isUniqueConstraintError(err)) continue
      throw err
    }
  }
  return NextResponse.json({ error: 'Could not generate a unique slug' }, { status: 409 })
}
