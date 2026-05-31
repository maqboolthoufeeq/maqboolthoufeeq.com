import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'
import { buildExcerpt } from '@/lib/utils'
import { BrandedOgCard, CoverOgCard, fetchImageAsDataUri, OG_CACHE_HEADERS, OG_SIZE } from '@/lib/og-card'
import { getSeo } from '@/lib/site-content'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Per-post Open Graph card (1200x630). When the post has a reachable cover
 * image we inline it full-bleed with a title overlay; otherwise we render a
 * branded gradient card. Always served from our own domain so social crawlers
 * (LinkedIn, Facebook, WhatsApp, X) never hit a redirect.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const row = await prisma.post.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, content: true, coverImage: true, published: true },
  })
  // Never leak drafts: only an existing *published* post gets its own card —
  // anything else (missing or unpublished) falls back to the branded site card,
  // matching the main page route which 404s unpublished posts.
  const post = row?.published ? row : null

  const seo = await getSeo()
  const title = post?.title ?? seo.siteName
  const subtitle = post?.excerpt?.trim() || (post ? buildExcerpt(post.content, 140) : seo.tagline)
  const cover = await fetchImageAsDataUri(post?.coverImage)

  const card = cover
    ? <CoverOgCard cover={cover} title={title} domain={seo.domain} author={seo.author} />
    : <BrandedOgCard title={title} subtitle={subtitle} domain={seo.domain} author={seo.author} role={seo.role} />

  return new ImageResponse(card, { ...OG_SIZE, headers: OG_CACHE_HEADERS })
}
