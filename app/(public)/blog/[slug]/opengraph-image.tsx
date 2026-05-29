import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'
import { buildExcerpt } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const alt = 'Maqbool Thoufeeq — Blog'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = { params: Promise<{ slug: string }> }

export default async function OpengraphImage({ params }: Props) {
  const { slug } = await params
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, content: true },
  })

  const title = post?.title ?? 'Maqbool Thoufeeq'
  const description = post?.excerpt?.trim() || (post ? buildExcerpt(post.content, 140) : 'Full-Stack Developer')

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
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>
            {title}
          </div>
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
    { ...size },
  )
}
