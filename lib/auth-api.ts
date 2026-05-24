import { NextRequest } from 'next/server'
import { auth } from './auth'
import { validateAccessToken } from './oauth'

/**
 * Returns true if the request is authenticated via either a NextAuth session
 * (browser-based admin) or a valid OAuth Bearer token (MCP / API clients).
 */
export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const session = await auth()
  if (session) return true

  const authorization = req.headers.get('authorization')
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice(7).trim()
    return validateAccessToken(token)
  }

  return false
}
