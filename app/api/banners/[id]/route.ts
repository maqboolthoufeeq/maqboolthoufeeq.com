import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateBanner } from '@/lib/banners'

type Ctx = { params: Promise<{ id: string }> }

// PATCH — update an announcement (admin only). Accepts any subset of fields,
// so the history list can flip `active` without resending the whole record.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.banner.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const result = validateBanner(body, { partial: true })
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })

  const banner = await prisma.banner.update({ where: { id }, data: result.data })
  return NextResponse.json(banner)
}

// DELETE — remove an announcement from history (admin only).
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.banner.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.banner.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
