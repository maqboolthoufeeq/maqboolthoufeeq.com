import { prisma } from '@/lib/prisma'
import { getSiteUrl } from '@/lib/utils'
import { submitToIndexNow } from '@/lib/indexnow'

export const dynamic = 'force-dynamic'

/**
 * GET /api/indexnow — submit every public URL (home, blog, projects, reels,
 * videos and each published post) to IndexNow so Bing/Yandex/etc. re-crawl
 * within ~24-48h. Safe to call by anyone: it only ever submits this site's own
 * URLs. Hit it once after a deploy, or wire it into your publish flow.
 */
export async function GET() {
  const base = getSiteUrl()
  const urls = [base, `${base}/blog`, `${base}/projects`, `${base}/reels`, `${base}/videos`]

  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { slug: true },
    })
    urls.push(...posts.map((p) => `${base}/blog/${p.slug}`))
  } catch {
    // Submit the static routes even if the DB is briefly unreachable.
  }

  const result = await submitToIndexNow(urls)
  return Response.json(result)
}
