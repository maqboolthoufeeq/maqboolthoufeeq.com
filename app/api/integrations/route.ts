import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listIntegrationsForAdmin, upsertIntegration } from '@/lib/integrations/store'
import { getProvider } from '@/lib/integrations/registry'

// GET /api/integrations — masked admin view of every provider (no secrets ever leave here).
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const integrations = await listIntegrationsForAdmin()
  return NextResponse.json({ integrations })
}

// PUT /api/integrations — create/update one provider's config + credentials.
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { provider?: string; values?: Record<string, unknown>; enabled?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const provider = getProvider(body.provider ?? '')
  if (!provider) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  // Coerce incoming values to strings; ignore unknown keys.
  const known = new Set(provider.fields.map((f) => f.key))
  const values: Record<string, string> = {}
  for (const [k, v] of Object.entries(body.values ?? {})) {
    if (known.has(k) && v != null) values[k] = String(v)
  }

  try {
    const result = await upsertIntegration(provider.id, values, body.enabled)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save integration'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
