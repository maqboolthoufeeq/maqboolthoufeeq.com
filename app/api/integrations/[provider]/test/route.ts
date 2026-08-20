import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getProvider } from '@/lib/integrations/registry'
import { getConnection } from '@/lib/integrations/store'

type Ctx = { params: Promise<{ provider: string }> }

// POST /api/integrations/[provider]/test — verify the stored credentials with a cheap call.
export async function POST(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider: providerId } = await params
  const provider = getProvider(providerId)
  if (!provider) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  if (typeof provider.test !== 'function') {
    return NextResponse.json({ ok: true, message: 'No connection test available for this provider' })
  }

  const connection = await getConnection(providerId)
  if (!connection) return NextResponse.json({ ok: false, message: 'Not connected yet' })

  try {
    const result = await provider.test(connection)
    return NextResponse.json(result)
  } catch {
    // Never leak internals/secrets from a failed test.
    return NextResponse.json({ ok: false, message: 'Connection test failed' })
  }
}
