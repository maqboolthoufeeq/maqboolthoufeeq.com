import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { HUB_LIMITS } from '@/lib/hub-content'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.hubCategory.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, color, order } = await req.json()

  if (name !== undefined && (!name.trim() || name.trim().length > HUB_LIMITS.categoryName)) {
    return NextResponse.json(
      { error: 'Name must be non-empty and under 80 characters' },
      { status: 400 },
    )
  }

  // Validate color format if provided
  if (color !== undefined && color !== null && typeof color === 'string') {
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json(
        { error: 'Color must be a hex code like #FF5500' },
        { status: 400 },
      )
    }
  }

  const category = await prisma.hubCategory.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(color !== undefined && { color: color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : null }),
      ...(order !== undefined && { order: Number(order) }),
    },
  })

  return NextResponse.json(category)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.hubCategory.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.hubCategory.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
