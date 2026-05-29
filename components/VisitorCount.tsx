import { getSiteContent } from '@/lib/site-content'
import { getSiteStats } from '@/lib/analytics'

/**
 * Small visitor/page-view figure shown inline in the landing-page footer.
 * Renders nothing unless the admin has enabled at least one metric. Colour is
 * inherited from the surrounding footer so it blends with every template.
 */
export default async function VisitorCount() {
  const analytics = await getSiteContent('analytics')
  if (!analytics.showVisitors && !analytics.showPageViews) return null

  const stats = await getSiteStats()
  const parts: string[] = []
  if (analytics.showVisitors) {
    parts.push(`${stats.visitors.toLocaleString('en-US')} ${stats.visitors === 1 ? 'visitor' : 'visitors'}`)
  }
  if (analytics.showPageViews) {
    parts.push(`${stats.pageViews.toLocaleString('en-US')} ${stats.pageViews === 1 ? 'view' : 'views'}`)
  }

  return (
    <>
      {parts.map((p) => (
        <span key={p} className="whitespace-nowrap">
          <span aria-hidden className="mx-1.5 opacity-60">
            ·
          </span>
          {p}
        </span>
      ))}
    </>
  )
}
