import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_THEME_ID, THEMES } from '@/lib/themes'

export async function GET() {
  const row = await prisma.siteContent.findUnique({ where: { key: 'theme' } })
  const id = (row?.value as { id?: string } | null)?.id ?? DEFAULT_THEME_ID
  return NextResponse.json({ id })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!THEMES.find((t) => t.id === id)) {
    return NextResponse.json({ error: 'Unknown theme' }, { status: 400 })
  }

  await prisma.siteContent.upsert({
    where: { key: 'theme' },
    update: { value: { id } },
    create: { key: 'theme', value: { id } },
  })

  return NextResponse.json({ id })
}
