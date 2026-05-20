import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSiteContent, setSiteContent } from '@/lib/site-content'

type Ctx = { params: Promise<{ key: string }> }

const ALLOWED_KEYS = ['navbar', 'hero', 'about', 'contact', 'footer', 'sections'] as const
type AllowedKey = (typeof ALLOWED_KEYS)[number]

function isAllowedKey(k: string): k is AllowedKey {
  return (ALLOWED_KEYS as readonly string[]).includes(k)
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { key } = await params
  if (!isAllowedKey(key)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const value = await getSiteContent(key)
  return NextResponse.json(value)
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await params
  if (!isAllowedKey(key)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  await setSiteContent(key, body)
  return NextResponse.json({ ok: true })
}
