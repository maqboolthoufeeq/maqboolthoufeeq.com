import { Users, Eye } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'
import AnalyticsToggles from '@/components/admin/AnalyticsToggles'
import { getSiteStats } from '@/lib/analytics'
import { getSiteContent } from '@/lib/site-content'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const [stats, analytics] = await Promise.all([getSiteStats(), getSiteContent('analytics')])

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

        <section>
          <h3 className="text-xs uppercase tracking-wider text-[var(--muted)] font-medium mb-3 px-1">
            Show on landing page
          </h3>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5">
            <AnalyticsToggles initial={analytics} />
          </div>
          <p className="text-xs text-[var(--muted)] mt-2 px-1">
            When enabled, the figure appears in small print in the footer of your public landing page.
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
