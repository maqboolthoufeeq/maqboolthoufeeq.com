import { headers } from 'next/headers'
import { getSiteUrl } from './utils'

/**
 * Resolve the origin of the *current request* (e.g. https://www.maqboolthoufeeq.com)
 * from the incoming headers. This is what makes social previews reliable: the
 * og:url and og:image we emit must live on the exact host the crawler fetched
 * — if they point at a different host (apex vs www, or a *.vercel.app domain)
 * the image hits a redirect and LinkedIn/Facebook reject it with
 * "cannot display preview".
 *
 * Falls back to the configured canonical site URL when headers are unavailable.
 */
export async function getRequestOrigin(): Promise<string> {
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    if (host) {
      const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https'
      // `.origin` normalizes (no trailing slash) and strips any path/query
      // injected via the host header; a malformed host throws here and is
      // caught below, so a crafted header can never crash metadata generation.
      return new URL(`${proto}://${host}`).origin
    }
  } catch {
    /* headers() unavailable (static context) or a malformed host — fall through */
  }
  return getSiteUrl()
}
