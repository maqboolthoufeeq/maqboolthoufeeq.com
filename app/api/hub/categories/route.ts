import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { HUB_LIMITS } from '@/lib/hub-content'

async function uniqueCategorySlug(base: string): Promise<string> {
  let slug = slugify(base) || 'category'
  let n = 1
  while (await prisma.hubCategory.findUnique({ where: { slug } })) {
    n++
    slug = `${slugify(base) || 'category'}-${n}`
  }
  return slug
}

export async function GET() {
  const categories = await prisma.hubCategory.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, color } = await req.json()

  if (!name?.trim() || name.trim().length > HUB_LIMITS.categoryName) {
    return NextResponse.json(
      { error: 'Name is required and must be under 80 characters' },
      { status: 400 },
    )
  }

  // Validate color format if provided
  if (color && typeof color === 'string') {
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json(
        { error: 'Color must be a hex code like #FF5500' },
        { status: 400 },
      )
    }
  }

  const slug = await uniqueCategorySlug(name)

  const category = await prisma.hubCategory.create({
    data: {
      name: name.trim(),
      slug,
      color: color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : null,
      order: 0,
    },
  })

  return NextResponse.json(category, { status: 201 })
}
