import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  createOAuthClient,
  listOAuthClients,
  deleteOAuthClient,
  updateOAuthClientRedirects,
  sanitizeRedirectUris,
  DEFAULT_MCP_REDIRECT_URIS,
} from '@/lib/oauth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clients = await listOAuthClients()
  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, redirectUrls } = await req.json()
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  // Default to the well-known hosted-MCP callbacks so a name-only client created
  // from the admin panel can complete the auth-code flow with claude.ai out of the
  // box. Any caller-supplied URIs are accepted but filtered to safe schemes first.
  const safe = sanitizeRedirectUris(redirectUrls)
  const client = await createOAuthClient(name, safe.length > 0 ? safe : DEFAULT_MCP_REDIRECT_URIS)
  return NextResponse.json(
    {
      id: client.id,
      name: client.name,
      clientId: client.clientId,
      clientSecret: client.clientSecret,
      redirectUrls: client.redirectUrls,
      createdAt: client.createdAt,
    },
    { status: 201 },
  )
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, redirectUrls } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const safe = sanitizeRedirectUris(redirectUrls)
  if (safe.length === 0) {
    return NextResponse.json(
      { error: 'At least one valid redirect URI is required (https, or http on localhost)' },
      { status: 400 },
    )
  }

  const client = await updateOAuthClientRedirects(id, safe)
  return NextResponse.json({ ...client, createdAt: client.createdAt.toISOString() })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  await deleteOAuthClient(id)
  return new NextResponse(null, { status: 204 })
}
