import { NextRequest, NextResponse } from 'next/server'
import { registerOAuthClient } from '@/lib/oauth'

// CORS: claude.ai and other browser-based MCP clients call this endpoint
// cross-origin, so the preflight and the response must be permissive.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

/**
 * RFC 7591 Dynamic Client Registration endpoint.
 *
 * MCP clients (claude.ai, Claude Desktop connectors, etc.) discover this via the
 * `registration_endpoint` field in /.well-known/oauth-authorization-server and
 * POST the redirect URIs they intend to use. We register a client bound to those
 * exact URIs and hand back the credentials, which the client then uses to run the
 * standard authorization-code + PKCE flow.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_client_metadata', error_description: 'Body must be JSON' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const redirectUris = body.redirect_uris
  if (!Array.isArray(redirectUris) || redirectUris.length === 0 || !redirectUris.every((u) => typeof u === 'string')) {
    return NextResponse.json(
      { error: 'invalid_redirect_uri', error_description: 'redirect_uris is required and must be a non-empty array of strings' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const clientName = typeof body.client_name === 'string' ? body.client_name : 'MCP Client'

  const client = await registerOAuthClient(clientName, redirectUris as string[])
  if (!client) {
    return NextResponse.json(
      { error: 'invalid_redirect_uri', error_description: 'Every redirect_uri must use https (or http on localhost)' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  return NextResponse.json(
    {
      client_id: client.clientId,
      client_secret: client.clientSecret,
      client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
      client_secret_expires_at: 0, // never expires
      client_name: client.name,
      redirect_uris: client.redirectUrls,
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_post',
    },
    { status: 201, headers: CORS_HEADERS },
  )
}
