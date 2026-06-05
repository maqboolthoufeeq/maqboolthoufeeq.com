import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify, isUniqueConstraintError } from '@/lib/utils'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { name, order } = await req.json()

  const data: { name?: string; slug?: string; order?: number } = {}
  if (order !== undefined) data.order = Number(order)

  // No rename → no slug to regenerate; a plain update is enough.
  if (name === undefined) {
    const category = await prisma.mediaCategory.update({ where: { id }, data })
    return NextResponse.json(category)
  }

  if (!name?.trim()) return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
  if (name.trim().length > 80) return NextResponse.json({ error: 'name is too long' }, { status: 400 })
  data.name = name.trim()
  const base = slugify(name.trim()) || 'topic'

  // Retry on unique-slug collisions (the DB constraint, not a pre-check, is
  // authoritative — so concurrent renames can't both grab the same slug).
  for (let i = 1; i <= 50; i++) {
    const slug = i === 1 ? base : `${base}-${i}`
    try {
      const category = await prisma.mediaCategory.update({ where: { id }, data: { ...data, slug } })
      return NextResponse.json(category)
    } catch (err) {
      if (isUniqueConstraintError(err)) continue
      throw err
    }
  }
  return NextResponse.json({ error: 'Could not generate a unique slug' }, { status: 409 })
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  // Items keep existing; their categoryId is set null via the schema relation.
  await prisma.mediaCategory.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
