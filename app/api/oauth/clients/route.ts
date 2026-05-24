import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createOAuthClient, listOAuthClients, deleteOAuthClient } from '@/lib/oauth'

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
  if (!name || !Array.isArray(redirectUrls) || redirectUrls.length === 0) {
    return NextResponse.json(
      { error: 'name and redirectUrls (non-empty array) are required' },
      { status: 400 },
    )
  }

  const client = await createOAuthClient(name, redirectUrls)
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

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  await deleteOAuthClient(id)
  return new NextResponse(null, { status: 204 })
}
