import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isPlatform, detectPlatform, parseEmbedId } from '@/lib/social'
import { fetchMediaMeta } from '@/lib/media-meta'

// Fetching third-party oEmbed + mirroring an image can take a moment.
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url, platform: rawPlatform } = await req.json()
  if (!url?.trim()) return NextResponse.json({ error: 'A URL is required' }, { status: 400 })

  const platform = isPlatform(rawPlatform) ? rawPlatform : detectPlatform(url)
  if (!platform) {
    return NextResponse.json({ error: 'Paste a YouTube or Instagram link' }, { status: 400 })
  }

  const embedId = parseEmbedId(platform, url)
  if (!embedId) {
    return NextResponse.json(
      { error: `Could not read a ${platform === 'youtube' ? 'YouTube video' : 'Instagram reel'} id from that URL` },
      { status: 400 },
    )
  }

  const meta = await fetchMediaMeta(platform, embedId)

  if (meta.blocked) {
    return NextResponse.json({
      platform,
      embedId,
      blocked: true,
      message:
        meta.blockedReason ||
        'Instagram wouldn’t share this reel’s details (it may be age-restricted or private). You can still add it and fill in the title/thumbnail manually.',
    })
  }

  return NextResponse.json({
    platform,
    embedId,
    title: meta.title,
    description: meta.description,
    thumbnailUrl: meta.thumbnailUrl,
    author: meta.author,
  })
}
