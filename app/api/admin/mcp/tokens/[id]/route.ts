import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { revokeToken } from '@/lib/oauth'

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await revokeToken(id)
  return new NextResponse(null, { status: 204 })
}
