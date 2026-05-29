import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'
import { buildExcerpt } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SIZE = { width: 1200, height: 630 }

/**
 * Fetch the cover image and inline it as a data URI so the rendered Open Graph
 * card is always served from our own domain at a guaranteed 1200x630 — the size
 * social crawlers (LinkedIn, Facebook, WhatsApp, X) expect. Returns null if the
 * cover is missing or unreachable, in which case we render a branded card.
 */
async function loadCover(coverImage: string | null): Promise<string | null> {
  if (!coverImage || !/^https?:\/\//i.test(coverImage)) return null
  try {
    const res = await fetch(coverImage, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const type = res.headers.get('content-type') || ''
    if (!type.startsWith('image/')) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength === 0) return null
    return `data:${type};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

const CACHE_HEADERS = {
  // Let the CDN / crawlers cache the generated card while allowing refreshes.
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, content: true, coverImage: true },
  })

  const title = post?.title ?? 'Maqbool Thoufeeq'
  const description = post?.excerpt?.trim() || (post ? buildExcerpt(post.content, 140) : 'Full-Stack Developer')
  const cover = await loadCover(post?.coverImage ?? null)

  if (cover) {
    return new ImageResponse(
      (
        <div style={{ position: 'relative', display: 'flex', width: '100%', height: '100%' }}>
          {/* Satori requires a raw img element; next/image is not supported here. */}
          <img
            src={cover}
            alt=""
            width={SIZE.width}
            height={SIZE.height}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '70px',
              background: 'linear-gradient(180deg, rgba(8,8,12,0.05) 35%, rgba(8,8,12,0.92) 100%)',
              color: '#ffffff',
              fontFamily: 'sans-serif',
            }}
          >
            <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1, maxWidth: 1040, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
              {title}
            </div>
            <div style={{ marginTop: 24, fontSize: 28, color: '#e2e8f0' }}>
              maqboolthoufeeq.com · Maqbool Thoufeeq
            </div>
          </div>
        </div>
      ),
      { ...SIZE, headers: CACHE_HEADERS },
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0d0d0f 0%, #1a1a2e 100%)',
          padding: '80px',
          color: '#f1f5f9',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 30, color: '#94a3b8' }}>
          maqboolthoufeeq.com
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>{title}</div>
          {description && (
            <div style={{ marginTop: 28, fontSize: 32, color: '#cbd5e1', lineHeight: 1.4, maxWidth: 980 }}>
              {description}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 28, color: '#94a3b8' }}>
          By Maqbool Thoufeeq · Full-Stack Developer
        </div>
      </div>
    ),
    { ...SIZE, headers: CACHE_HEADERS },
  )
}
