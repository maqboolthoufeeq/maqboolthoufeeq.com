import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listTokens, createDirectToken, listOAuthClients } from '@/lib/oauth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [tokens, clients] = await Promise.all([listTokens(), listOAuthClients()])
  return NextResponse.json({ tokens, clients })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { label } = await req.json()
  if (!label?.trim()) return NextResponse.json({ error: 'label is required' }, { status: 400 })

  const result = await createDirectToken(label.trim())
  return NextResponse.json(result, { status: 201 })
}
