import { NextRequest } from 'next/server'
import { auth } from './auth'
import { validateAccessToken } from './oauth'

/**
 * Returns true if the request is authenticated via either a NextAuth session
 * (browser-based admin) or a valid OAuth Bearer token (MCP / API clients).
 */
export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  // Check the Bearer token first. MCP / API clients are by far the highest-volume
  // callers and never carry a NextAuth session cookie, so validating the token up
  // front avoids decoding a session on every single request (Active CPU we were
  // burning needlessly on the runaway /mcp traffic). Browser admin requests have
  // no Bearer header and fall straight through to the session check below.
  const authorization = req.headers.get('authorization')
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice(7).trim()
    if (await validateAccessToken(token)) return true
  }

  const session = await auth()
  return Boolean(session)
}
