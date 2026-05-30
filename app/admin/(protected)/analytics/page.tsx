import Link from 'next/link'
import { Users, Eye, Zap } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'
import AnalyticsToggles from '@/components/admin/AnalyticsToggles'
import { getSiteStats } from '@/lib/analytics'
import { getSiteContent } from '@/lib/site-content'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const [stats, analytics, posts] = await Promise.all([
    getSiteStats(),
    getSiteContent('analytics'),
    prisma.post.findMany({
      orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, title: true, published: true, views: true, zaps: true },
    }),
  ])

  return (
    <AdminShell title="Analytics" back="/admin" backLabel="Dashboard">
      <div className="space-y-6 sm:space-y-8">
        <section className="pt-2">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-medium">Website traffic</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mt-1">Analytics</h2>
          <p className="text-sm text-[var(--muted)] mt-1">Total visitors and page views across the site.</p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <BigStat icon={Users} label="Unique visitors" value={stats.visitors} />
          <BigStat icon={Eye} label="Page views" value={stats.pageViews} />
        </section>

        {/* Per-post blog analytics */}
        <section>
          <h3 className="text-xs uppercase tracking-wider text-[var(--muted)] font-medium mb-3 px-1">
            Blog posts
          </h3>
          {posts.length === 0 ? (
            <p className="text-sm text-[var(--muted)] px-1">No posts yet.</p>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <ul className="divide-y divide-[var(--border)]">
                {posts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/admin/posts/${p.id}/edit`}
                      className="row-pressable flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--background)] transition-colors"
                    >
                      <span className="min-w-0 flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-[var(--foreground)]">{p.title}</span>
                        {!p.published && (
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)] bg-[var(--border)] rounded-full px-1.5 py-0.5">
                            Draft
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 inline-flex items-center gap-3 text-[13px] text-[var(--muted)] tabular-nums">
                        <span className="inline-flex items-center gap-1" title={`${p.views} views`}>
                          <Eye size={14} className="shrink-0" />
                          {p.views.toLocaleString('en-US')}
                        </span>
                        <span className="inline-flex items-center gap-1" title={`${p.zaps} zaps`}>
                          <Zap size={14} className="shrink-0" />
                          {p.zaps.toLocaleString('en-US')}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-[var(--muted)] mt-2 px-1">
            Views and zaps are tracked per post. Tap a post to edit it.
          </p>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wider text-[var(--muted)] font-medium mb-3 px-1">
            Public visibility
          </h3>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5">
            <AnalyticsToggles initial={analytics} />
          </div>
          <p className="text-xs text-[var(--muted)] mt-2 px-1">
            Visitor and page-view figures appear in small print in your landing-page footer; blog stats appear at the top of each post. All are off by default.
          </p>
        </section>
      </div>
    </AdminShell>
  )
}

function BigStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number }>
  label: string
  value: number
}) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-4">
      <span className="shrink-0 w-12 h-12 rounded-xl bg-[var(--background)] flex items-center justify-center text-[var(--accent)]">
        <Icon size={24} />
      </span>
      <div>
        <p className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tabular-nums">
          {value.toLocaleString('en-US')}
        </p>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">{label}</p>
      </div>
    </div>
  )
}
