import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { prisma } from './prisma'

const CODE_TTL_MS = 10 * 60 * 1000       // 10 minutes
const TOKEN_TTL_MS = 90 * 24 * 3600 * 1000 // 90 days

function generate(bytes = 32) {
  return randomBytes(bytes).toString('hex')
}

/**
 * SHA-256 hash for at-rest storage of high-entropy bearer secrets (access tokens,
 * authorization codes, client secrets). These values are 256+ bits of randomness,
 * so a fast hash is the correct choice here (unlike low-entropy user passwords,
 * which need bcrypt): it allows an O(1) indexed lookup while guaranteeing that a
 * database leak never exposes a usable credential. The columns historically named
 * `token` / `clientSecret` / `code` now store this HASH, never the plaintext — the
 * plaintext is returned to the caller exactly once at creation and never persisted.
 */
function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

/** Constant-time comparison of two hex-encoded hashes (avoids timing leaks). */
function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'hex')
  const bb = Buffer.from(b, 'hex')
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

/**
 * A redirect_uri uses a safe scheme: https everywhere, or http on loopback for
 * local development clients. Anything else (custom schemes, plain http on a
 * public host, malformed URLs) is rejected — those are the open-redirect /
 * token-exfiltration vectors.
 */
export function isSafeRedirectUri(redirectUri: string): boolean {
  let url: URL
  try {
    url = new URL(redirectUri)
  } catch {
    return false
  }
  if (url.protocol === 'https:') return true
  if (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) return true
  return false
}

/**
 * A redirect_uri is acceptable only if it was pre-registered for the client
 * (exact match — no prefix games) AND uses a safe scheme. An empty registration
 * list is rejected outright (previously it acted as an "allow any redirect"
 * wildcard, an open-redirect / token-exfiltration hole).
 */
export function isAllowedRedirectUri(registered: string[], redirectUri: string): boolean {
  if (!registered || registered.length === 0) return false
  if (!registered.includes(redirectUri)) return false
  return isSafeRedirectUri(redirectUri)
}

export async function createOAuthClient(name: string, redirectUrls: string[] = []) {
  const clientId = `mcp_${randomBytes(10).toString('hex')}`
  const clientSecret = randomBytes(42).toString('base64url')
  const client = await prisma.oAuthClient.create({
    // Persist only the hash of the secret; hand the plaintext back to the caller once.
    data: { name, clientId, clientSecret: sha256(clientSecret), redirectUrls },
  })
  return { ...client, clientSecret }
}

/**
 * RFC 7591 Dynamic Client Registration. MCP clients (e.g. claude.ai) call this
 * with the redirect URIs they will use; we mint a client_id/client_secret bound
 * to exactly those URIs. Registration is intentionally open (no admin session):
 * minting a client grants no access on its own — the authorization-code flow
 * still requires the site owner to log in and click "Allow" on the consent
 * screen before any token is issued. Returns null if any redirect URI is unsafe
 * or none were supplied.
 */
export async function registerOAuthClient(name: string, redirectUrls: string[]) {
  if (!Array.isArray(redirectUrls) || redirectUrls.length === 0) return null
  if (!redirectUrls.every(isSafeRedirectUri)) return null
  return createOAuthClient(name || 'MCP Client', redirectUrls)
}

export async function listOAuthClients() {
  return prisma.oAuthClient.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, clientId: true, redirectUrls: true, createdAt: true },
  })
}

export async function deleteOAuthClient(id: string) {
  return prisma.oAuthClient.delete({ where: { id } })
}

export async function createAuthCode(clientId: string, redirectUrl: string, codeChallenge?: string) {
  const code = generate(32)
  await prisma.oAuthAuthCode.create({
    data: {
      code: sha256(code), // store the hash; the plaintext code travels only in the redirect
      clientId,
      redirectUrl,
      codeChallenge: codeChallenge ?? null,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  })
  return code
}

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<string | null> {
  const codeHash = sha256(code)
  const authCode = await prisma.oAuthAuthCode.findUnique({
    where: { code: codeHash },
    include: { client: true },
  })

  if (!authCode) return null
  if (authCode.used) return null
  if (authCode.expiresAt < new Date()) return null
  if (authCode.client.clientId !== clientId) return null
  if (!safeEqualHex(authCode.client.clientSecret, sha256(clientSecret))) return null
  if (authCode.redirectUrl !== redirectUri) return null

  // PKCE is mandatory: every auth code must carry an S256 challenge and the token
  // request must prove possession of the matching verifier.
  if (!authCode.codeChallenge || !codeVerifier) return null
  const digest = createHash('sha256').update(codeVerifier).digest('base64url')
  if (digest !== authCode.codeChallenge) return null

  // Atomic single-use claim: only the first concurrent request flips used false→true,
  // so a replayed/raced code can never mint a second token (TOCTOU fix).
  const claimed = await prisma.oAuthAuthCode.updateMany({
    where: { code: codeHash, used: false },
    data: { used: true },
  })
  if (claimed.count !== 1) return null

  const token = generate(48)
  await prisma.oAuthAccessToken.create({
    data: {
      token: sha256(token), // store the hash; return the plaintext below
      clientId: authCode.clientId,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  })
  return token
}

export async function validateAccessToken(token: string): Promise<boolean> {
  // Look up by hash — the exact-match index lookup is O(1) and does not leak the
  // plaintext via timing. A stored row only ever holds the hash.
  const record = await prisma.oAuthAccessToken.findUnique({ where: { token: sha256(token) } })
  if (!record) return false
  if (record.expiresAt < new Date()) return false
  return true
}

export async function getClientByClientId(clientId: string) {
  return prisma.oAuthClient.findUnique({ where: { clientId } })
}

/** Create a token directly (no OAuth dance) — used from the admin panel. */
export async function createDirectToken(label: string) {
  const token = generate(48)
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS)
  const record = await prisma.oAuthAccessToken.create({
    data: { token: sha256(token), label, expiresAt }, // store hash; return plaintext once
    select: { id: true, label: true, expiresAt: true, createdAt: true },
  })
  return { ...record, token }
}

export async function listTokens() {
  return prisma.oAuthAccessToken.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, label: true, createdAt: true, expiresAt: true,
      client: { select: { name: true } },
    },
  })
}

export async function revokeToken(id: string) {
  return prisma.oAuthAccessToken.delete({ where: { id } })
}
