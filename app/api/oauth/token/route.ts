import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken } from '@/lib/oauth'

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

  const { grant_type, code, client_id, client_secret, redirect_uri } = body

  if (grant_type !== 'authorization_code') {
    return NextResponse.json(
      { error: 'unsupported_grant_type' },
      { status: 400 },
    )
  }

  if (!code || !client_id || !client_secret || !redirect_uri) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  const token = await exchangeCodeForToken(code, client_id, client_secret, redirect_uri)
  if (!token) {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 })
  }

  return NextResponse.json({
    access_token: token,
    token_type: 'Bearer',
    expires_in: 31536000, // 1 year in seconds
  })
}
