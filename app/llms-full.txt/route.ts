import { prisma } from '@/lib/prisma'
import { getSeo } from '@/lib/site-content'
import { getRequestOrigin } from '@/lib/request-origin'
import { stripHtml } from '@/lib/utils'

/**
 * /llms-full.txt — the long-form companion to /llms.txt: the plain-text body of
 * every published article concatenated for AI ingestion. Lets answer engines
 * read and cite the actual content (with source links) rather than guessing.
 */
export const dynamic = 'force-dynamic'

const HEADERS = {
  'content-type': 'text/plain; charset=utf-8',
  'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
}

// Cap per-article text so a few very long posts can't bloat the file past what
// crawlers will fetch; the canonical page link is always included for the rest.
const MAX_CHARS_PER_POST = 6000

type PostRow = {
  title: string
  slug: string
  excerpt: string | null
  content: string
  publishedAt: Date | null
  tags: { name: string }[]
}

export async function GET() {
  const [origin, seo] = await Promise.all([getRequestOrigin(), getSeo()])

  let posts: PostRow[] = []
  try {
    posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        publishedAt: true,
        tags: { select: { name: true } },
      },
    })
  } catch {
    /* serve the header even if the DB is briefly unreachable */
  }

  const lines: string[] = [
    `# ${seo.author} — Full content`,
    '',
    `> ${seo.tagline}`,
    '',
    `Source: ${origin}`,
    '',
  ]

  for (const p of posts) {
    const text = stripHtml(p.content)
    const body = text.length > MAX_CHARS_PER_POST ? `${text.slice(0, MAX_CHARS_PER_POST)}…` : text
    lines.push('---', '')
    lines.push(`## ${p.title}`)
    lines.push(`URL: ${origin}/blog/${p.slug}`)
    if (p.publishedAt) lines.push(`Published: ${p.publishedAt.toISOString().slice(0, 10)}`)
    if (p.tags.length) lines.push(`Tags: ${p.tags.map((t) => t.name).join(', ')}`)
    if (p.excerpt?.trim()) lines.push(`Summary: ${p.excerpt.trim()}`)
    lines.push('')
    lines.push(body)
    lines.push('')
  }

  return new Response(lines.join('\n'), { headers: HEADERS })
}
