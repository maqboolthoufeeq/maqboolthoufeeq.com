import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken } from '@/lib/oauth'

// Browser-based MCP clients (e.g. claude.ai) may exchange the auth code from the
// browser, so the token endpoint must answer cross-origin preflight + requests.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  let body: Record<string, string>

  const contentType = req.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    body = await req.json()
  } else {
    const form = await req.formData()
    body = Object.fromEntries(
      Array.from(form.entries()).map(([k, v]) => [k, String(v)]),
    )
  }

  const { grant_type, code, client_id, client_secret, redirect_uri, code_verifier } = body

  if (grant_type !== 'authorization_code') {
    return NextResponse.json(
      { error: 'unsupported_grant_type' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  if (!code || !client_id || !client_secret || !redirect_uri) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400, headers: CORS_HEADERS })
  }

  const token = await exchangeCodeForToken(code, client_id, client_secret, redirect_uri, code_verifier)
  if (!token) {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400, headers: CORS_HEADERS })
  }

  return NextResponse.json(
    {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 90 * 24 * 3600, // 90 days in seconds
    },
    { headers: CORS_HEADERS },
  )
}
