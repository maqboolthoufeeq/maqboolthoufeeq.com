import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRequestOrigin } from '@/lib/request-origin'
import { buildPostInput, buildHubInput, crossPost, getPublishHistory } from '@/lib/integrations/publish'
import type { PublishInput } from '@/lib/integrations/types'

type ContentType = 'post' | 'hubItem' | 'hubTopic'

async function buildInput(contentType: ContentType, contentId: string, baseUrl: string): Promise<PublishInput | null> {
  if (contentType === 'post') {
    const post = await prisma.post.findUnique({ where: { id: contentId }, include: { tags: { select: { name: true } } } })
    return post ? buildPostInput(post, baseUrl) : null
  }
  if (contentType === 'hubItem') {
    const item = await prisma.hubItem.findUnique({ where: { id: contentId }, include: { topic: { select: { slug: true } } } })
    if (!item) return null
    return buildHubInput(
      { id: item.id, title: item.title, description: item.description, url: item.url, content: item.content, topicSlug: item.topic.slug },
      baseUrl,
      'hubItem',
    )
  }
  if (contentType === 'hubTopic') {
    const topic = await prisma.hubTopic.findUnique({ where: { id: contentId }, select: { id: true, title: true, description: true, slug: true } })
    if (!topic) return null
    return buildHubInput(
      { id: topic.id, title: topic.title, description: topic.description, url: null, content: null, topicSlug: topic.slug },
      baseUrl,
      'hubTopic',
    )
  }
  return null
}

// GET /api/integrations/publish?contentType=&contentId= — past cross-post attempts.
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const contentType = searchParams.get('contentType') ?? ''
  const contentId = searchParams.get('contentId') ?? ''
  if (!contentType || !contentId) return NextResponse.json({ history: [] })
  const history = await getPublishHistory(contentType, contentId)
  return NextResponse.json({ history })
}

// POST /api/integrations/publish — cross-post one piece of content to selected providers.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { contentType?: ContentType; contentId?: string; providers?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { contentType, contentId, providers } = body
  if (!contentType || !contentId || !['post', 'hubItem', 'hubTopic'].includes(contentType)) {
    return NextResponse.json({ error: 'contentType and contentId are required' }, { status: 400 })
  }

  const baseUrl = await getRequestOrigin()
  const input = await buildInput(contentType, contentId, baseUrl)
  if (!input) return NextResponse.json({ error: 'Content not found' }, { status: 404 })

  const results = await crossPost(input, Array.isArray(providers) ? providers : undefined)
  const published = results.filter((r) => r.ok).length
  return NextResponse.json({ results, summary: { total: results.length, published, failed: results.length - published } })
}
