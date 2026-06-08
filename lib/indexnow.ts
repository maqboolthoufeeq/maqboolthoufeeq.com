import { getSiteUrl } from '@/lib/utils'

/**
 * IndexNow lets us instantly notify Bing, Yandex, Naver, Seznam and Yep that a
 * URL changed — typically indexed in 24-48h vs 1-2 weeks from a sitemap alone.
 *
 * The key is PUBLIC by design: it is published at `/{key}.txt` so the search
 * engines can verify ownership. It is therefore safe to commit. The public key
 * file (`public/<key>.txt`) MUST contain exactly this string.
 */
export const INDEXNOW_KEY = 'ab263ba31a9314f3f414023089431783'

const ENDPOINT = 'https://api.indexnow.org/indexnow'

export interface IndexNowResult {
  ok: boolean
  status: number
  submitted: number
}

/** Submit a batch of absolute URLs (same host) to IndexNow. Never throws. */
export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  const list = Array.from(new Set(urls.filter((u) => /^https?:\/\//i.test(u))))
  if (list.length === 0) return { ok: false, status: 0, submitted: 0 }

  const base = getSiteUrl()
  const host = new URL(base).host
  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${base}/${INDEXNOW_KEY}.txt`,
    urlList: list,
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })
    return { ok: res.ok, status: res.status, submitted: list.length }
  } catch {
    return { ok: false, status: 0, submitted: list.length }
  }
}
