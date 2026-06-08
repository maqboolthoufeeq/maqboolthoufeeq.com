import { prisma } from '@/lib/prisma'
import { getSeo, getSiteContent } from '@/lib/site-content'
import { getRequestOrigin } from '@/lib/request-origin'
import { normalizeSameAs } from '@/lib/structured-data'
import { buildExcerpt, stripHtml } from '@/lib/utils'

/**
 * /llms.txt — the llmstxt.org standard: a curated, markdown map of the site for
 * AI engines (ChatGPT, Perplexity, Claude, Gemini) to discover and cite the
 * highest-value pages without crawling everything. Generated from live content
 * so it stays current as posts/projects are added.
 */
export const dynamic = 'force-dynamic'

const HEADERS = {
  'content-type': 'text/plain; charset=utf-8',
  'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
}

type PostRow = { title: string; slug: string; excerpt: string | null; content: string }
type ProjectRow = { title: string; description: string; liveUrl: string | null; repoUrl: string | null }

export async function GET() {
  const [origin, seo, hero, about] = await Promise.all([
    getRequestOrigin(),
    getSeo(),
    getSiteContent('hero'),
    getSiteContent('about'),
  ])

  let posts: PostRow[] = []
  let projects: ProjectRow[] = []
  try {
    posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      select: { title: true, slug: true, excerpt: true, content: true },
    })
  } catch {
    /* serve the rest even if the DB is briefly unreachable */
  }
  try {
    projects = await prisma.project.findMany({
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      select: { title: true, description: true, liveUrl: true, repoUrl: true },
    })
  } catch {
    /* ignore */
  }

  const sameAs = normalizeSameAs(hero.socialLinks)
  const intro = about.paragraphs?.[0] ? stripHtml(about.paragraphs[0]) : seo.tagline

  const lines: string[] = [
    `# ${seo.author}`,
    '',
    `> ${seo.tagline}`,
    '',
    intro,
    '',
    '## Key pages',
    `- [Home](${origin}/): Portfolio, projects and writing by ${seo.author}.`,
    `- [Blog](${origin}/blog): Technical articles on backend engineering, AI systems and distributed systems.`,
    `- [Projects](${origin}/projects): Selected engineering projects.`,
    '',
  ]

  if (posts.length) {
    lines.push('## Blog posts')
    for (const p of posts) {
      const desc = p.excerpt?.trim() || buildExcerpt(p.content, 140)
      lines.push(`- [${p.title}](${origin}/blog/${p.slug})${desc ? `: ${desc}` : ''}`)
    }
    lines.push('')
  }

  if (projects.length) {
    lines.push('## Projects')
    for (const pr of projects) {
      const url = pr.liveUrl || pr.repoUrl || `${origin}/projects`
      const desc = pr.description ? buildExcerpt(pr.description, 140) : ''
      lines.push(`- [${pr.title}](${url})${desc ? `: ${desc}` : ''}`)
    }
    lines.push('')
  }

  if (sameAs.length) {
    lines.push('## Profiles')
    for (const s of sameAs) lines.push(`- ${s}`)
    lines.push('')
  }

  lines.push('## Full text')
  lines.push(`- [llms-full.txt](${origin}/llms-full.txt): Full text of every published article, for LLM ingestion.`)
  lines.push('')

  return new Response(lines.join('\n'), { headers: HEADERS })
}
