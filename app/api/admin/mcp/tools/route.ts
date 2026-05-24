import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const KEY = 'mcp_config'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = await prisma.siteContent.findUnique({ where: { key: KEY } })
  const config = (row?.value ?? {}) as { disabledTools?: string[] }
  return NextResponse.json({ disabledTools: config.disabledTools ?? [] })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { disabledTools } = await req.json()
  if (!Array.isArray(disabledTools)) {
    return NextResponse.json({ error: 'disabledTools must be an array' }, { status: 400 })
  }

  await prisma.siteContent.upsert({
    where:  { key: KEY },
    update: { value: { disabledTools } },
    create: { key: KEY, value: { disabledTools } },
  })
  return NextResponse.json({ ok: true })
}
