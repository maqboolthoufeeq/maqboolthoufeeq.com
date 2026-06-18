import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBanners, validateBanner, type CleanBanner } from '@/lib/banners'

// GET — full announcement history (public). Admins and visitors see the same
// chronological list; the landing page bar separately reads the newest active one.
export async function GET() {
  const banners = await getBanners()
  return NextResponse.json(banners)
}

// POST — create a new announcement (admin only).
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const result = validateBanner(body)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })

  const data = result.data as CleanBanner
  const banner = await prisma.banner.create({
    data: {
      message: data.message,
      linkLabel: data.linkLabel ?? null,
      linkUrl: data.linkUrl ?? null,
      variant: data.variant ?? 'info',
      active: data.active ?? true,
    },
  })
  return NextResponse.json(banner, { status: 201 })
}
