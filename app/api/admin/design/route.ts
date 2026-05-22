import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_DESIGN_ID, DESIGNS } from '@/lib/designs'

export async function GET() {
  const row = await prisma.siteContent.findUnique({ where: { key: 'design' } })
  const id = (row?.value as { id?: string } | null)?.id ?? DEFAULT_DESIGN_ID
  return NextResponse.json({ id })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!DESIGNS.find((d) => d.id === id)) {
    return NextResponse.json({ error: 'Unknown design' }, { status: 400 })
  }

  await prisma.siteContent.upsert({
    where: { key: 'design' },
    update: { value: { id } },
    create: { key: 'design', value: { id } },
  })

  return NextResponse.json({ id })
}
