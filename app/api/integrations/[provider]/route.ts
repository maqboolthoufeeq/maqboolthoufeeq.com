import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deleteIntegration, setEnabled } from '@/lib/integrations/store'
import { getProvider } from '@/lib/integrations/registry'

type Ctx = { params: Promise<{ provider: string }> }

// PATCH /api/integrations/[provider] — toggle enabled without re-sending credentials.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider } = await params
  if (!getProvider(provider)) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  if (typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled (boolean) is required' }, { status: 400 })
  }
  await setEnabled(provider, body.enabled)
  return NextResponse.json({ ok: true, enabled: body.enabled })
}

// DELETE /api/integrations/[provider] — disconnect and wipe stored credentials.
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider } = await params
  if (!getProvider(provider)) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  await deleteIntegration(provider)
  return new NextResponse(null, { status: 204 })
}
