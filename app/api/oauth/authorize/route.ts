import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getClientByClientId, createAuthCode } from '@/lib/oauth'
import { getPublicOrigin } from '@/lib/utils'

const CONSENT_HTML = (clientName: string, params: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize Access</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; border-radius: 12px; padding: 2rem; max-width: 420px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
    p { color: #555; font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5; }
    .client-name { font-weight: 600; color: #111; }
    .perms { background: #f9f9f9; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; }
    .perms li { font-size: 0.875rem; color: #444; padding: 0.25rem 0; list-style: none; display: flex; align-items: center; gap: 0.5rem; }
    .perms li::before { content: "✓"; color: #16a34a; font-weight: 700; }
    .actions { display: flex; gap: 0.75rem; }
    button { flex: 1; padding: 0.65rem 1rem; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; }
    .allow { background: #111; color: white; }
    .deny  { background: #f3f3f3; color: #555; }
    .allow:hover { background: #333; }
    .deny:hover  { background: #e8e8e8; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Authorize Access</h1>
    <p><span class="client-name">${clientName}</span> is requesting access to your blog.</p>
    <ul class="perms">
      <li>Read and list blog posts</li>
      <li>Create and update blog posts</li>
      <li>Publish and unpublish posts</li>
      <li>Upload media (images)</li>
    </ul>
    <form method="POST" action="/api/oauth/authorize">
      <input type="hidden" name="params" value="${params}">
      <div class="actions">
        <button type="submit" name="decision" value="allow" class="allow">Allow</button>
        <button type="submit" name="decision" value="deny"  class="deny">Deny</button>
      </div>
    </form>
  </div>
</body>
</html>`

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('client_id')
  const redirectUri = searchParams.get('redirect_uri')
  const state = searchParams.get('state') ?? ''
  const responseType = searchParams.get('response_type')
  const codeChallenge = searchParams.get('code_challenge')
  const codeChallengeMethod = searchParams.get('code_challenge_method')

  if (responseType !== 'code') {
    return new NextResponse('Unsupported response_type', { status: 400 })
  }
  if (!clientId || !redirectUri) {
    return new NextResponse('Missing client_id or redirect_uri', { status: 400 })
  }
  if (codeChallenge && codeChallengeMethod !== 'S256') {
    return new NextResponse('Only code_challenge_method=S256 is supported', { status: 400 })
  }

  const client = await getClientByClientId(clientId)
  if (!client) {
    return new NextResponse('Unknown client_id', { status: 400 })
  }
  if (client.redirectUrls.length > 0 && !client.redirectUrls.includes(redirectUri)) {
    return new NextResponse('redirect_uri not registered for this client', { status: 400 })
  }

  const session = await auth()
  if (!session) {
    const publicOrigin = getPublicOrigin(req)
    const internalOrigin = new URL(req.url).origin
    const publicUrl = req.url.replace(internalOrigin, publicOrigin)
    const returnUrl = encodeURIComponent(publicUrl)
    return NextResponse.redirect(new URL(`/admin/login?returnUrl=${returnUrl}`, publicOrigin))
  }

  const params = encodeURIComponent(
    JSON.stringify({ clientId, redirectUri, state, codeChallenge }),
  )
  return new NextResponse(CONSENT_HTML(client.name, params), {
    headers: { 'Content-Type': 'text/html' },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const form = await req.formData()
  const decision = form.get('decision')
  const rawParams = form.get('params')

  if (!rawParams || typeof rawParams !== 'string') {
    return new NextResponse('Missing params', { status: 400 })
  }

  let clientId: string, redirectUri: string, state: string, codeChallenge: string | undefined
  try {
    ;({ clientId, redirectUri, state, codeChallenge } = JSON.parse(decodeURIComponent(rawParams)))
  } catch {
    return new NextResponse('Invalid params', { status: 400 })
  }

  if (decision === 'deny') {
    const url = new URL(redirectUri)
    url.searchParams.set('error', 'access_denied')
    if (state) url.searchParams.set('state', state)
    return NextResponse.redirect(url.toString())
  }

  const client = await getClientByClientId(clientId)
  if (!client) {
    return new NextResponse('Invalid client', { status: 400 })
  }
  if (client.redirectUrls.length > 0 && !client.redirectUrls.includes(redirectUri)) {
    return new NextResponse('redirect_uri not registered for this client', { status: 400 })
  }

  const code = await createAuthCode(client.id, redirectUri, codeChallenge)
  const url = new URL(redirectUri)
  url.searchParams.set('code', code)
  if (state) url.searchParams.set('state', state)

  return NextResponse.redirect(url.toString())
}
