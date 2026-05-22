import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_TEMPLATE_ID, TEMPLATES } from '@/lib/template-defs'

export async function GET() {
  const row = await prisma.siteContent.findUnique({ where: { key: 'template' } })
  const id = (row?.value as { id?: string } | null)?.id ?? DEFAULT_TEMPLATE_ID
  return NextResponse.json({ id })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!TEMPLATES.find((t) => t.id === id)) {
    return NextResponse.json({ error: 'Unknown template' }, { status: 400 })
  }

  await prisma.siteContent.upsert({
    where: { key: 'template' },
    update: { value: { id } },
    create: { key: 'template', value: { id } },
  })

  return NextResponse.json({ id })
}
